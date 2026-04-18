import { signOutAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

type OverviewResponse = {
  current_admin: {
    id: string;
    email?: string;
  };
  stats: {
    tools_count: number;
    categories_count: number;
    today_submissions_count: number;
    pending_submissions_count: number;
  };
  tools: Array<{
    id: number;
    name: string;
    slug: string;
    category_name: string;
    website_url: string | null;
    is_hot: boolean | null;
    is_new: boolean | null;
    status: string | null;
    published_at: string | null;
    created_at: string | null;
  }>;
  pending_submissions: Array<{
    id: number;
    name: string;
    slug: string;
    website_url: string | null;
    status: string | null;
    created_at: string | null;
  }>;
};

const cardItems = [
  {
    key: "tools_count",
    label: "AI 工具总数",
    hint: "正式工具表 ai_tools",
  },
  {
    key: "categories_count",
    label: "分类总数",
    hint: "工具分类表 tool_categories",
  },
  {
    key: "today_submissions_count",
    label: "今日提交数",
    hint: "当天新增的用户提交",
  },
  {
    key: "pending_submissions_count",
    label: "待审核数",
    hint: "status = pending",
  },
] as const;

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

async function getOverview() {
  const headerStore = await headers();
  const host = headerStore.get("host");
  const cookie = headerStore.get("cookie") ?? "";
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";

  if (!host) {
    throw new Error("无法获取当前请求地址");
  }

  const response = await fetch(`${protocol}://${host}/api/admin/overview`, {
    headers: {
      cookie,
    },
    cache: "no-store",
  });

  if (response.status === 401 || response.status === 403) {
    redirect("/sign-in?error=当前账号没有后台访问权限");
  }

  if (!response.ok) {
    throw new Error("后台数据加载失败");
  }

  return (await response.json()) as OverviewResponse;
}

export default async function ProtectedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const overview = await getOverview();

  return (
    <main className="min-h-screen bg-black px-4 py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="rounded-3xl border border-border/60 bg-background/90 p-6 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
                Dirs Admin
              </p>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold text-foreground">
                  后台管理首页
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  这里是管理员登录后的工作台，集中展示平台统计、待审核提交与工具管理入口。
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 lg:items-end">
              <div className="text-sm text-muted-foreground">当前管理员</div>
              <div className="text-base font-medium text-foreground">
                {overview.current_admin.email ?? user.email ?? "未识别邮箱"}
              </div>
              <form action={signOutAction}>
                <Button type="submit" variant="outline">
                  退出登录
                </Button>
              </form>
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="rounded-3xl border border-border/60 bg-background/85 p-4 shadow-sm">
            <div className="mb-4 text-sm font-medium text-foreground">导航</div>
            <nav className="flex flex-col gap-2">
              <a
                href="#overview"
                className="rounded-2xl border border-border/60 px-4 py-3 text-sm transition hover:bg-muted/40"
              >
                概览
              </a>
              <a
                href="#review"
                className="rounded-2xl border border-border/60 px-4 py-3 text-sm transition hover:bg-muted/40"
              >
                审核
              </a>
              <a
                href="#users"
                className="rounded-2xl border border-border/60 px-4 py-3 text-sm transition hover:bg-muted/40"
              >
                用户管理
              </a>
            </nav>
          </aside>

          <div className="flex flex-col gap-6">
            <section
              id="overview"
              className="rounded-3xl border border-border/60 bg-background/90 p-6 shadow-sm"
            >
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">概览</h2>
                  <p className="text-sm text-muted-foreground">
                    按 PRD 展示 4 张核心统计卡片，帮助管理员快速判断平台状态。
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild>
                    <Link href="#tools">查看工具列表</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="#review">前往审核区</Link>
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {cardItems.map((item) => (
                  <article
                    key={item.key}
                    className="rounded-2xl border border-border/60 bg-muted/20 p-5"
                  >
                    <div className="text-sm text-muted-foreground">{item.label}</div>
                    <div className="mt-3 text-3xl font-semibold text-foreground">
                      {overview.stats[item.key]}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {item.hint}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section
              id="review"
              className="rounded-3xl border border-border/60 bg-background/90 p-6 shadow-sm"
            >
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">审核</h2>
                  <p className="text-sm text-muted-foreground">
                    默认展示待审核提交，后续可以继续扩展通过/拒绝操作。
                  </p>
                </div>
                <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                  待审核 {overview.stats.pending_submissions_count} 条
                </div>
              </div>

              {overview.pending_submissions.length > 0 ? (
                <div className="overflow-hidden rounded-2xl border border-border/60">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead className="bg-muted/30 text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-medium">名称</th>
                        <th className="px-4 py-3 font-medium">Slug</th>
                        <th className="px-4 py-3 font-medium">官网</th>
                        <th className="px-4 py-3 font-medium">提交时间</th>
                        <th className="px-4 py-3 font-medium">状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview.pending_submissions.map((item) => (
                        <tr key={item.id} className="border-t border-border/60">
                          <td className="px-4 py-3 font-medium text-foreground">
                            {item.name}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {item.slug}
                          </td>
                          <td className="px-4 py-3">
                            {item.website_url ? (
                              <a
                                href={item.website_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary underline-offset-4 hover:underline"
                              >
                                打开官网
                              </a>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatDate(item.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                              {item.status ?? "pending"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/70 px-5 py-10 text-center text-sm text-muted-foreground">
                  当前没有待审核提交，审核列表为空。
                </div>
              )}
            </section>

            <section
              id="tools"
              className="rounded-3xl border border-border/60 bg-background/90 p-6 shadow-sm"
            >
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-foreground">工具列表</h2>
                <p className="text-sm text-muted-foreground">
                  展示最近创建的工具，后续可继续接入搜索、筛选、分页与编辑操作。
                </p>
              </div>

              {overview.tools.length > 0 ? (
                <div className="overflow-hidden rounded-2xl border border-border/60">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead className="bg-muted/30 text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-medium">名称</th>
                        <th className="px-4 py-3 font-medium">Slug</th>
                        <th className="px-4 py-3 font-medium">分类</th>
                        <th className="px-4 py-3 font-medium">状态</th>
                        <th className="px-4 py-3 font-medium">标签</th>
                        <th className="px-4 py-3 font-medium">创建时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview.tools.map((tool) => (
                        <tr key={tool.id} className="border-t border-border/60">
                          <td className="px-4 py-3">
                            <div className="font-medium text-foreground">{tool.name}</div>
                            {tool.website_url ? (
                              <a
                                href={tool.website_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-primary underline-offset-4 hover:underline"
                              >
                                访问官网
                              </a>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{tool.slug}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {tool.category_name}
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                              {tool.status ?? "published"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              {tool.is_hot ? (
                                <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700">
                                  热门
                                </span>
                              ) : null}
                              {tool.is_new ? (
                                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                  最新
                                </span>
                              ) : null}
                              {!tool.is_hot && !tool.is_new ? (
                                <span className="text-xs text-muted-foreground">-</span>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatDate(tool.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/70 px-5 py-10 text-center text-sm text-muted-foreground">
                  当前还没有工具数据，可以继续接入“新增工具”能力。
                </div>
              )}
            </section>

            <section
              id="users"
              className="rounded-3xl border border-border/60 bg-background/90 p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold text-foreground">用户管理</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                根据 PRD，用户管理页将负责查看用户、设置管理员身份、取消管理员权限，
                并防止误删最后一个管理员。当前首页先提供后台入口与状态概览，后续可以继续扩展独立的用户管理页面。
              </p>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
