# Dirs Admin

一个基于 `Next.js 15 + Supabase` 构建的 AI 导航站后台管理系统。

这个项目围绕 AI 工具站的真实运营场景设计，主要解决以下问题：

- 管理员登录与后台权限控制
- AI 工具的新增、查看、编辑、删除
- 用户提交工具后的审核流
- 审核通过后自动写入正式工具表
- 工具分类管理
- 后台管理员身份管理

---

## 功能概览

当前项目已经覆盖的核心模块：

- 后台概览页
  - AI 工具总数
  - 分类总数
  - 今日提交数
  - 待审核数
- AI 工具管理
  - 新增工具
  - 查看详情
  - 编辑工具
  - 删除工具
- 审核中心
  - 待审核
  - 已通过
  - 已驳回
  - 通过后同步写入 `ai_tools`
- 工具分类管理
  - 新增分类
  - 编辑分类
  - 删除分类
  - 已被引用的分类不可删除
- 用户管理
  - 查看所有用户
  - 设为管理员
  - 取消管理员身份
  - 防止删除最后一个管理员

---

## 技术栈

- `Next.js 15`
- `React 19`
- `TypeScript`
- `Supabase`
- `@supabase/supabase-js`
- `@supabase/ssr`
- `Tailwind CSS`
- `shadcn/ui`

---

## 项目结构

```txt
app/
  admin/                     # 审核中心等后台路由
  protected/                 # 后台页面主体
  api/admin/                 # 后台 API
components/
  admin/                     # 后台组件
lib/
  admin-*.ts                 # 服务端取数与后台辅助方法
utils/supabase/
  admin.ts                   # service_role 客户端
  server.ts                  # 服务端 Supabase 客户端
  client.ts                  # 浏览器端 Supabase 客户端
docs/
  prd.md                     # 需求文档
  sql.md                     # 数据表结构说明
```

---

## 数据库设计

项目围绕以下 4 张核心表工作：

- `admin_users`
  - 后台管理员权限表
- `tool_categories`
  - 工具分类表
- `tool_submissions`
  - 用户提交待审核表
- `ai_tools`
  - 正式上线工具表

详细表结构可参考：

- [docs/sql.md](docs/sql.md)
- [docs/prd.md](docs/prd.md)

---

## 权限设计

后台权限不是单纯依赖 Supabase Auth，而是通过 `admin_users` 单独控制：

- 用户可以正常注册 / 登录
- 只有存在于 `admin_users` 中的用户才允许进入后台
- 所有后台 API 都会再次校验当前用户是否为管理员
- 后台数据库操作统一走 `service_role`

当前项目约定：

- 页面不直接操作 Supabase 表
- 所有数据库请求统一通过 `app/api/admin/*`
- API 内部统一使用 `utils/supabase/admin.ts`

---

## Storage 约定

项目中图片上传使用 Supabase Storage。

需要提前创建以下 bucket：

- `tool-logos`
  - AI 工具 Logo
- `tool-covers`
  - AI 工具封面图

如果你希望前台或后台直接通过 URL 预览图片，需要确保 bucket 可被正确访问，或者使用可访问的公开链接。

---

## 环境变量

请在项目根目录创建 `.env.local`，并至少配置以下变量：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
```

说明：

- `NEXT_PUBLIC_SUPABASE_URL`
  - Supabase 项目地址
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - 前端使用的 publishable key
- `SUPABASE_SERVICE_KEY`
  - 服务端使用的 `service_role` 私钥，仅允许在服务端使用

---

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env.local`，并填入上面的 Supabase 变量。

### 3. 准备数据库

你至少需要在 Supabase 中创建以下数据表：

- `admin_users`
- `tool_categories`
- `tool_submissions`
- `ai_tools`

表结构可直接参考 [docs/sql.md](docs/sql.md)。

同时建议补充：

- `set_updated_at()` 函数
- 对应触发器
- `admin_users` 的 RLS / policy

### 4. 初始化首个管理员

由于后台权限基于 `admin_users`，你需要先手动插入第一条管理员记录：

```sql
insert into public.admin_users (user_id, role)
values ('你的-auth.users.id', 'admin');
```

### 5. 启动开发服务器

```bash
npm run dev
```

默认访问地址：

```txt
http://localhost:3000
```

---

## 后台路由

主要页面入口如下：

- `/`
  - 首页跳转入口
- `/sign-in`
  - 登录页
- `/sign-up`
  - 注册页
- `/protected`
  - 后台概览页
- `/protected/categories`
  - 分类管理
- `/protected/tools`
  - AI 工具管理
- `/protected/tools/new`
  - 新增 AI 工具
- `/protected/users`
  - 用户管理
- `/admin/submissions`
  - 审核中心

---

## 已实现的业务流程

### 管理员登录流程

1. 用户登录
2. 服务端校验是否存在于 `admin_users`
3. 非管理员直接拦截，不允许进入后台

### 新增 AI 工具流程

1. 管理员进入新增工具页
2. 上传 Logo / 封面图到 Supabase Storage
3. 填写工具信息与 Markdown 内容
4. 提交后写入 `ai_tools`

### 审核通过流程

1. 用户提交工具进入 `tool_submissions`
2. 管理员在审核中心查看详情
3. 点击通过
4. 系统将提交数据写入 `ai_tools`
5. 同时把 `tool_submissions.status` 更新为 `approved`

### 审核驳回流程

1. 管理员填写驳回原因
2. 更新 `tool_submissions.status = 'rejected'`
3. 写入 `review_notes` 与 `reviewed_at`

---

## 开发说明

当前项目偏向“后台运营系统”，实现时有几个重要约束：

- 所有 API 都必须做管理员校验
- 所有服务端高权限数据库操作统一走 `service_role`
- 工具与分类管理都要考虑数据完整性
- 审核流要确保 `tool_submissions` 和 `ai_tools` 的状态同步

---

## 后续可扩展方向

- AI 工具列表搜索 / 筛选 / 分页
- 审核记录历史与审计日志
- 更细粒度的角色体系，例如 `super_admin`
- 分类图标上传而不是手填 URL
- 后台操作日志
- 更完整的仪表盘统计图表

---

## 相关文章

项目博客草稿已整理在：

- [docs/project-blog-draft.md](docs/project-blog-draft.md)

---

## License

仅用于学习、开发和项目演示，具体授权方式可根据你的实际需求补充。
