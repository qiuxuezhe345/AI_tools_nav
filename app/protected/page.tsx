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
            按 PRD 展示 4 张核心统计卡片，帮助管理员快速判断平台状态。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="bg-white text-black hover:bg-white/90">
            <Link href="/protected/review">前往审核页</Link>
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
        概览页作为后台首页，当前聚焦展示核心统计。工具列表、待审核列表和用户管理已拆分到顶部导航对应的独立页面中。
      </div>
    </section>
  );
}
