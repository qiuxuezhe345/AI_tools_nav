import { Button } from "@/components/ui/button";
import { ToolDeleteButton } from "@/components/admin/tool-delete-button";
import { formatDate, getTools } from "@/lib/admin-tools";
import { Eye, Pencil } from "lucide-react";
import Link from "next/link";

export default async function ToolsPage() {
  const tools = await getTools();

  return (
    <section className="rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">AI 工具管理</h2>
          <p className="text-sm text-white/60">
            这里集中管理已创建的 AI 工具，支持查看、编辑和删除操作。
          </p>
        </div>
        <Button asChild className="bg-white text-black hover:bg-white/90">
          <Link href="/protected/tools/new">添加 AI 工具</Link>
        </Button>
      </div>

      {tools.length > 0 ? (
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
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {tools.map((tool) => (
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
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-start gap-2">
                      <Button
                        asChild
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-full border-white/15 bg-transparent text-white hover:bg-white hover:text-black"
                      >
                        <Link
                          href={`/protected/tools/${tool.id}`}
                          title="查看"
                          aria-label="查看"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-full border-white/15 bg-transparent text-white hover:bg-white hover:text-black"
                      >
                        <Link
                          href={`/protected/tools/${tool.id}/edit`}
                          title="编辑"
                          aria-label="编辑"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <ToolDeleteButton toolId={tool.id} />
                    </div>
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
