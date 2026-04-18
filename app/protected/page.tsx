import { Button } from "@/components/ui/button";
import { cardItems, getOverview } from "@/lib/admin-dashboard";
import Link from "next/link";

export default async function ProtectedPage() {
  const overview = await getOverview();

  return (
    <section className="rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">概览</h2>
          <p className="text-sm text-white/60">
            按 PRD 展示 4 张核心统计卡片，并提供后台常用入口，方便快速进入分类、工具、审核和用户管理。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="bg-white text-black hover:bg-white/90">
            <Link href="/protected/tools/new">添加 AI 工具</Link>
          </Button>
          <Button asChild className="bg-white text-black hover:bg-white/90">
            <Link href="/admin/submissions">前往审核中心</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-white/15 bg-transparent text-white hover:bg-white hover:text-black"
          >
            <Link href="/protected/categories">前往工具分类</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-white/15 bg-transparent text-white hover:bg-white hover:text-black"
          >
            <Link href="/protected/tools">前往 AI 工具管理</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-white/15 bg-transparent text-white hover:bg-white hover:text-black"
          >
            <Link href="/protected/users">前往用户管理</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cardItems.map((item) => (
          <article
            key={item.key}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
          >
            <div className="text-sm text-white/55">{item.label}</div>
            <div className="mt-3 text-3xl font-semibold text-white">
              {overview.stats[item.key]}
            </div>
            <div className="mt-2 text-xs text-white/40">{item.hint}</div>
          </article>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-dashed border-white/15 px-5 py-6 text-sm leading-6 text-white/60">
        概览页现在也提供了工具分类入口。分类管理页会直接对 `tool_categories`
        做增删改查，并在删除时检查是否已经被 `ai_tools` 或 `tool_submissions`
        引用，避免误删影响线上数据。
      </div>
    </section>
  );
}
