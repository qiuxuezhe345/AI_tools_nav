import { getOverview, formatDate } from "@/lib/admin-dashboard";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function ToolsPage() {
  const overview = await getOverview();

  return (
    <section className="rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">AI 工具管理</h2>
          <p className="text-sm text-white/60">
            这里集中管理已创建的 AI 工具，后续可继续扩展新增、编辑、筛选和分页能力。
          </p>
        </div>
        <Button asChild className="bg-white text-black hover:bg-white/90">
          <Link href="/protected/tools/new">添加 AI 工具</Link>
        </Button>
      </div>

      {overview.tools.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-white/[0.03] text-white/55">
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
                <tr key={tool.id} className="border-t border-white/10">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{tool.name}</div>
                    {tool.website_url ? (
                      <a
                        href={tool.website_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-white/70 underline underline-offset-4"
                      >
                        访问官网
                      </a>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-white/60">{tool.slug}</td>
                  <td className="px-4 py-3 text-white/60">{tool.category_name}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/70">
                      {tool.status ?? "published"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {tool.is_hot ? (
                        <span className="rounded-full bg-rose-500/15 px-2.5 py-1 text-xs font-medium text-rose-200">
                          热门
                        </span>
                      ) : null}
                      {tool.is_new ? (
                        <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-200">
                          最新
                        </span>
                      ) : null}
                      {!tool.is_hot && !tool.is_new ? (
                        <span className="text-xs text-white/40">-</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white/60">
                    {formatDate(tool.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/15 px-5 py-10 text-center text-sm text-white/60">
          当前还没有 AI 工具数据，请先添加工具。
        </div>
      )}
    </section>
  );
}
