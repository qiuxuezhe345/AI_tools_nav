# AI导航站后台需求文档

## 1. 项目概述

### 1.1 项目背景

当前 AI 导航站基于 **Supabase 实现，已有以下三张核心业务表：**

* `ai_tools`：AI 工具正式数据表
* `tool_categories`：工具分类表
* `tool_submissions`：用户提交工具审核表

为了便于平台运营、工具内容管理、用户提交审核以及后台权限控制，需要新增一套后台管理系统。

### 1.2 项目目标

建设一个仅管理员可访问的后台管理系统，满足以下目标：

1. 管理员可查看平台核心数据概览
2. 管理员可手动新增 AI 工具到正式工具表
3. 管理员可查看并编辑已上线 AI 工具
4. 管理员可审核用户提交的工具数据
5. 审核通过后，系统将提交数据同步写入正式工具表
6. 管理员可管理后台管理员身份
7. 非管理员用户不可进入后台

---

## 2. 系统角色与权限

### 2.1 角色定义

系统包含两类角色：

#### 普通用户

* 可在前台提交 AI 工具
* 提交内容进入 `tool_submissions`
* 不可进入后台
* 不可执行审核、编辑、管理员设置等操作

#### 管理员

* 可登录并进入后台
* 可查看概览数据
* 可新增 AI 工具
* 可查看、编辑 AI 工具
* 可审核用户提交
* 可设置其他用户是否为管理员

### 2.2 权限控制目标

后台必须基于管理员身份进行访问控制：

* 已登录但不是管理员：禁止访问后台
* 未登录用户：禁止访问后台
* 只有存在于 `admin_users` 表中的用户，才允许进入后台

---

## 3. 数据库设计

### 3.1 现有业务表

当前系统已有以下业务表：

* `ai_tools`
* `tool_categories`
* `tool_submissions`

这些表继续沿用，不做结构性替换。

### 3.2 新增管理员表：admin_users

为了实现后台管理员身份控制，新增 `admin_users` 表。

#### 表用途

用于标记哪些用户具备后台访问权限。

#### 建表 SQL

```sql
create table public.admin_users (
  id bigserial primary key,
  user_id uuid not null unique,
  role varchar(20) not null default 'admin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_users_user_id_fkey
    foreign key (user_id) references auth.users(id)
    on delete cascade
);

create index if not exists idx_admin_users_user_id
  on public.admin_users(user_id);
```

#### 字段说明

* `id`：主键
* `user_id`：关联 Supabase Auth 用户 ID，唯一
* `role`：管理员角色，当前默认 `admin`，后续可扩展 `super_admin`
* `created_at`：创建时间
* `updated_at`：更新时间

### 3.3 管理员表设计说明

* 一个用户最多对应一条管理员记录
* 删除用户时，管理员记录自动删除
* 后续如需扩展更细粒度权限，可基于 `role` 字段继续扩展

### 3.4 admin_users 的 RLS 与策略设计

为了保证后台权限安全，`admin_users` 表必须开启 RLS，并限制只有管理员才能读取和维护管理员列表。

#### 设计目标

1. 普通登录用户不能随意查看全部管理员名单
2. 普通登录用户不能把自己设置为管理员
3. 只有已存在的管理员，才能管理 `admin_users`
4. 用户可以读取自己的管理员记录，用于前端判断是否可进入后台

#### 推荐 SQL

```sql
-- 1) 开启 RLS
alter table public.admin_users enable row level security;

-- 2) 可选：强制所有访问都走 RLS（更安全）
alter table public.admin_users force row level security;

-- 3) 辅助函数：判断当前用户是否管理员
create or replace function public.is_admin(check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = check_user_id
  );
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated;

-- 4) 用户可查看自己的管理员记录
create policy "admin_users_select_own"
on public.admin_users
for select
to authenticated
using (user_id = auth.uid());

-- 5) 管理员可查看全部管理员记录
create policy "admin_users_select_for_admin"
on public.admin_users
for select
to authenticated
using (public.is_admin(auth.uid()));

-- 6) 只有管理员可以新增管理员
create policy "admin_users_insert_for_admin"
on public.admin_users
for insert
to authenticated
with check (public.is_admin(auth.uid()));

-- 7) 只有管理员可以修改管理员记录
create policy "admin_users_update_for_admin"
on public.admin_users
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- 8) 只有管理员可以删除管理员记录
create policy "admin_users_delete_for_admin"
on public.admin_users
for delete
to authenticated
using (public.is_admin(auth.uid()));
```

#### 策略说明

* `select_own`：允许用户读取自己的管理员记录，方便前端判断是否为管理员
* `select_for_admin`：管理员可以查看全部管理员记录，用于后台用户管理页
* `insert/update/delete_for_admin`：只有管理员才能维护管理员列表

#### 为什么要加 `is_admin()` 函数

如果策略里直接在 `admin_users` 上查询 `admin_users`，容易遇到递归策略问题。使用 `security definer` 函数可以更稳定地完成管理员身份判断。

#### 首个管理员初始化

由于“只有管理员才能新增管理员”，所以系统初始化时需要你在 Supabase SQL Editor 中手动插入第一条管理员记录：

```sql
insert into public.admin_users (user_id, role)
values ('你的-auth-users-id', 'admin');
```

#### 推荐补充：更新时间触发器

如果你已有 `set_updated_at()` 函数，也建议给 `admin_users` 增加触发器：

```sql
create trigger trg_admin_users_updated_at
before update on public.admin_users
for each row
execute function public.set_updated_at();
```

#### 推荐补充：防止误删最后一个管理员

建议后续增加数据库函数或服务端校验，防止删除系统最后一个管理员，避免后台失控。

---

## 4. 后台信息架构

后台采用左侧导航结构，包含 3 个一级菜单：

1. 概览
2. 审核
3. 用户管理

### 4.1 页面结构

#### 概览

用于展示平台整体统计信息、工具管理入口、工具列表管理。

#### 审核

用于查看待审核的用户提交，并执行通过或拒绝操作。

#### 用户管理

用于管理用户管理员身份，控制谁可以进入后台。

---

## 5. 功能需求详述

# 5.1 概览页面

## 5.1.1 页面目标

概览页作为后台首页，需满足以下用途：

* 展示平台核心统计数据
* 快速新增 AI 工具
* 查看所有 AI 工具
* 编辑已有 AI 工具

## 5.1.2 顶部操作区

页面右上角提供“添加 AI 工具”按钮。

### 按钮交互

* 点击按钮后，从页面右侧弹出 Drawer
* Drawer 中展示新增工具表单
* 表单提交后，将数据写入 `ai_tools`
* 提交成功后：

  * 关闭 Drawer
  * 刷新工具列表
  * 刷新顶部统计卡片

## 5.1.3 新增工具 Drawer 表单字段

表单字段需与 `ai_tools` 表结构对应，建议包含：

* `name`：工具名称
* `slug`：工具唯一标识
* `category_id`：所属分类
* `website_url`：官网地址
* `logo_url`：Logo 图片地址
* `cover_image_url`：封面图片地址
* `short_description`：简短描述
* `content`：工具详细内容
* `is_hot`：是否热门
* `is_new`：是否最新
* `status`：状态，默认 `published`
* `published_at`：发布时间，默认当前时间

### 表单交互要求

* `name` 必填
* `slug` 必填且唯一
* `category_id` 必填
* `website_url` 必填
* `short_description` 必填
* `short_description` 长度建议不超过 300 字
* `slug` 可支持根据名称自动生成，但允许管理员手动修改
* 提交前需做基础校验

## 5.1.4 顶部统计卡片

页面顶部展示 4 个统计卡片：

### 卡片一：AI 工具数量

* 数据来源：`ai_tools`
* 统计逻辑：统计全部工具数量

### 卡片二：AI 分类数量

* 数据来源：`tool_categories`
* 统计逻辑：统计全部分类数量

### 卡片三：当日用户提交

* 数据来源：`tool_submissions`
* 统计逻辑：统计当天创建的数据数量

### 卡片四：未审核用户提交

* 数据来源：`tool_submissions`
* 统计逻辑：统计 `status = 'pending'` 的数量

## 5.1.5 工具列表区

页面底部展示所有 AI 工具列表。

### 列表字段建议

* ID
* 工具名称
* Slug
* 分类名称
* 官网地址
* 是否热门
* 是否最新
* 状态
* 发布时间
* 创建时间
* 操作

### 操作项

* 查看
* 编辑

### 查看功能

点击查看后，可打开详情弹窗或详情页，展示完整工具信息。

### 编辑功能

点击编辑后，可打开 Drawer 或 Dialog，对以下字段进行编辑：

* 名称
* slug
* 分类
* 官网
* logo
* 封面
* 简介
* 详细内容
* 是否热门
* 是否最新
* 状态

编辑成功后需要刷新列表数据。

### 列表能力建议

为了后续可用性，建议支持以下能力：

* 按工具名称搜索
* 按分类筛选
* 按状态筛选
* 按是否热门筛选
* 分页展示
* 按创建时间倒序排序

---

# 5.2 审核页面

## 5.2.1 页面目标

审核页面用于处理普通用户提交的 AI 工具数据。

管理员可以：

* 查看待审核提交
* 查看提交详情
* 审核通过
* 审核拒绝

## 5.2.2 待审核列表

默认展示 `tool_submissions` 中 `status = 'pending'` 的数据。

### 列表字段建议

* 提交 ID
* 工具名称
* slug
* 分类
* 官网地址
* 简介
* 提交用户 ID
* 提交时间
* 操作

### 操作项

* 查看详情
* 审核通过
* 审核拒绝

## 5.2.3 查看详情

管理员点击查看后，可查看完整提交信息：

* 名称
* slug
* 分类
* 官网地址
* logo
* 封面
* 简介
* 内容详情
* 提交时间
* 提交用户

## 5.2.4 审核通过逻辑

当管理员点击“审核通过”时，系统执行以下流程：

### 第一步：写入 ai_tools

将当前 `tool_submissions` 记录中的核心字段插入到 `ai_tools` 表中。

写入字段包括：

* `category_id`
* `name`
* `slug`
* `website_url`
* `logo_url`
* `cover_image_url`
* `short_description`
* `content`
* `status`，写入 `published`
* `published_at`，写入当前时间
* `source_submission_id`，记录当前提交 ID

### 第二步：更新 tool_submissions

更新当前提交记录：

* `status` 更新为 `approved`
* `approved_tool_id` 更新为新插入工具的 ID
* `reviewed_at` 更新为当前时间

### 第三步：前端反馈

* 操作成功提示
* 待审核列表刷新
* 概览统计刷新

## 5.2.5 审核拒绝逻辑

当管理员点击“审核拒绝”时：

* 更新 `tool_submissions.status = 'rejected'`
* 更新 `review_notes`
* 更新 `reviewed_at`

### 拒绝交互要求

* 点击拒绝后弹出输入框或弹窗
* 管理员可填写拒绝原因
* 拒绝原因写入 `review_notes`

## 5.2.6 审核事务要求

审核通过涉及两步数据库写操作：

1. 插入 `ai_tools`
2. 更新 `tool_submissions`

为保证数据一致性，建议通过以下任一方式实现：

* 使用数据库事务
* 使用 Supabase RPC 封装审核通过逻辑
* 使用服务端 Action / API Route 统一执行，避免前端分别发两次请求

## 5.2.7 状态值说明

当前 `tool_submissions.status` 已有：

* `pending`
* `approved`
* `rejected`

说明：原需求中提到“将 status 修改成为 success”，但当前数据库约束中并不存在 `success`，因此需求落地时统一使用 `approved` 作为审核通过状态。

---

# 5.3 用户管理页面

## 5.3.1 页面目标

用户管理页面用于设置某个用户是否具有后台管理员权限。

## 5.3.2 功能说明

管理员可以：

* 查看平台用户
* 查看当前用户是否是管理员
* 将普通用户设为管理员
* 取消某个用户的管理员权限

## 5.3.3 数据来源

该页面依赖两类数据：

1. 用户基础数据

   * 来源：`auth.users` 或项目中的用户资料表
2. 管理员数据

   * 来源：`admin_users`

如果当前项目没有单独用户资料表，建议后续新增 `profiles` 表用于展示昵称、头像、邮箱等更友好的信息。

## 5.3.4 列表字段建议

* 用户 ID
* 邮箱
* 昵称（如有）
* 注册时间
* 是否管理员
* 操作

## 5.3.5 设置管理员

当管理员点击“设为管理员”时：

* 向 `admin_users` 插入一条记录
* `user_id` 为目标用户 ID
* `role` 默认为 `admin`

## 5.3.6 取消管理员

当管理员点击“取消管理员”时：

* 删除该用户在 `admin_users` 中的记录

## 5.3.7 业务限制建议

为避免后台无人管理，建议增加以下限制：

* 系统最后一个管理员不可被取消管理员身份
* 当前登录管理员不能误删自己权限，除非系统存在其他管理员

---

## 6. 后台访问控制需求

### 6.1 登录要求

后台必须要求用户先登录。

### 6.2 管理员校验

登录后需校验当前用户是否存在于 `admin_users` 表中。

### 6.3 校验逻辑

* 用户未登录：跳转登录页
* 用户已登录但不是管理员：跳转前台首页或 403 页面
* 用户已登录且是管理员：允许访问后台

### 6.4 建议实现位置

建议在以下位置实现后台访问保护：

* 中间件 `middleware`
* 后台 Layout 服务端校验
* 服务端接口二次校验

说明：前端页面校验只能改善体验，真正安全控制必须在服务端再次判断管理员身份。

---

## 7. 业务流程设计

### 7.1 管理员新增工具流程

1. 管理员进入概览页
2. 点击“添加 AI 工具”按钮
3. 右侧弹出 Drawer
4. 填写表单并提交
5. 系统校验字段
6. 写入 `ai_tools`
7. 刷新统计与工具列表

### 7.2 用户提交审核通过流程

1. 普通用户在前台提交工具
2. 数据进入 `tool_submissions`，状态为 `pending`
3. 管理员进入审核页
4. 查看待审核记录
5. 点击“审核通过”
6. 系统将提交数据写入 `ai_tools`
7. 系统更新该提交为 `approved`
8. 记录 `approved_tool_id` 和 `reviewed_at`

### 7.3 用户提交审核拒绝流程

1. 管理员在审核页点击“拒绝”
2. 输入拒绝原因
3. 系统更新 `tool_submissions.status = 'rejected'`
4. 写入 `review_notes` 和 `reviewed_at`

### 7.4 设置管理员流程

1. 管理员进入用户管理页
2. 选择目标用户
3. 点击“设为管理员”
4. 系统写入 `admin_users`
5. 目标用户下次登录后可访问后台

---

## 8. 接口与服务设计建议

### 8.1 概览页接口

建议提供服务端聚合接口，统一返回：

* 工具总数
* 分类总数
* 今日提交数
* 待审核数
* AI 工具列表

### 8.2 新增工具接口

负责新增 `ai_tools` 数据。

### 8.3 编辑工具接口

负责更新 `ai_tools` 某条记录。

### 8.4 待审核列表接口

负责查询 `tool_submissions` 中 `pending` 数据。

### 8.5 审核通过接口

负责统一执行：

* 插入 `ai_tools`
* 更新 `tool_submissions`

### 8.6 审核拒绝接口

负责更新：

* `status = 'rejected'`
* `review_notes`
* `reviewed_at`

### 8.7 用户管理接口

负责：

* 查询用户及管理员状态
* 设置管理员
* 取消管理员

---

## 9. 页面与交互要求

### 9.1 通用交互要求

* 所有异步操作需要 loading 状态
* 所有提交操作需要成功/失败提示
* 删除或高风险操作需要二次确认
* 表格为空时显示空状态
* 接口异常时显示错误提示

### 9.2 概览页交互要求

* 页面加载时自动拉取统计卡片数据与工具列表
* 新增成功后自动刷新页面数据
* 编辑成功后自动刷新工具列表

### 9.3 审核页交互要求

* 默认仅展示待审核数据
* 审核完成后当前记录从待审核列表移除
* 拒绝时必须支持填写备注

### 9.4 用户管理页交互要求

* 切换管理员状态前需弹出确认
* 操作后即时刷新列表状态

---

## 10. 验收标准

### 10.1 概览模块验收标准

* 可以成功进入概览页面
* 顶部可正确展示 4 个统计卡片
* 可通过 Drawer 新增 AI 工具
* 新增后数据真实写入 `ai_tools`
* 工具列表可以正常展示全部工具
* 可查看和编辑工具数据

### 10.2 审核模块验收标准

* 可正确展示所有待审核提交
* 点击通过后，数据写入 `ai_tools`
* 对应提交状态更新为 `approved`
* `approved_tool_id` 被正确记录
* `reviewed_at` 被正确记录
* 点击拒绝后，状态更新为 `rejected`
* 拒绝原因被写入 `review_notes`

### 10.3 用户管理模块验收标准

* 可以看到用户列表与管理员状态
* 可以将普通用户设为管理员
* 可以取消某个用户的管理员身份
* 非管理员无法进入后台
* 管理员可以正常进入后台

### 10.4 权限验收标准

* 未登录用户访问后台会被拦截
* 非管理员访问后台会被拦截
* 只有 `admin_users` 中存在记录的用户可访问后台

---

## 11. 风险与注意事项

### 11.1 slug 唯一性冲突

`ai_tools.slug` 和 `tool_submissions.slug` 都可能出现重复，新增或审核通过前必须校验 slug 是否已存在，避免写入失败。

### 11.2 审核通过的数据一致性

审核通过涉及两步写操作，必须保证一致性，避免出现：

* 工具已插入，但提交状态未更新
* 提交状态已更新，但工具未成功插入

### 11.3 用户数据来源问题

Supabase 的 `auth.users` 通常更适合服务端读取，前端直接获取受限。若后续需要更完整的用户展示信息，建议新增 `profiles` 表。

### 11.4 权限控制不能只做前端

仅前端隐藏菜单并不安全，必须在服务端接口层做管理员权限校验。

---

## 12. 后续扩展建议

为了便于后续产品演进，建议未来考虑以下扩展：

### 12.1 概览增强

* 最近 7 天提交趋势图
* 最热门分类排行
* 最近新增工具列表

### 12.2 工具管理增强

* 批量上下线
* 批量删除
* 推荐位配置
* SEO 字段管理

### 12.3 审核增强

* 已审核记录查询
* 审核历史筛选
* 审核人字段记录

### 12.4 权限增强

* 区分 `super_admin` 和 `admin`
* 不同管理员拥有不同模块权限

---

## 13. 开发建议结论

本后台系统建议优先完成以下最小可用版本：

### 第一阶段

* 新建 `admin_users` 表
* 完成后台登录权限控制
* 完成概览页统计卡片
* 完成 AI 工具新增与编辑
* 完成审核页通过/拒绝逻辑
* 完成用户管理页管理员开关

### 第二阶段

* 增加搜索、筛选、分页
* 增加审核记录历史
* 增加更细分的角色权限
* 增加操作日志

---

## 14. 最终结论

该后台系统的核心定位是：

**为 AI 导航站提供一个具备工具管理、用户提交审核、管理员权限控制能力的后台管理平台。**

系统建设完成后，将形成以下闭环：

* 普通用户负责提交工具
* 管理员负责审核与发布
* 平台通过后台统一管理正式数据
* 通过 `admin_users` 实现后台访问权限隔离

这套设计与当前 Supabase 表结构兼容度高，可直接进入产品设计与开发阶段。
