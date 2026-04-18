import { Button } from "@/components/ui/button";
import { getToolById } from "@/lib/admin-tools";
import { renderMarkdown } from "@/lib/markdown";
import Link from "next/link";

export default async function ToolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tool = await getToolById(id);
  const contentHtml = renderMarkdown(tool.content ?? "");

  return (
    <section className="rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">查看 AI 工具</h2>
          <p className="mt-2 text-sm text-white/60">
            查看工具详情、图片资源与 Markdown 内容。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            asChild
            variant="outline"
            className="border-white/15 bg-transparent text-white hover:bg-white hover:text-black"
          >
            <Link href="/protected/tools">返回列表</Link>
          </Button>
          <Button asChild className="bg-white text-black hover:bg-white/90">
            <Link href={`/protected/tools/${tool.id}/edit`}>编辑工具</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-white">{tool.name}</h3>
                <div className="mt-2 text-sm text-white/55">{tool.short_description}</div>
              </div>
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
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h4 className="text-sm font-medium text-white">详细介绍</h4>
            <div
              className="markdown-preview mt-4 text-sm leading-7 text-white/80"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h4 className="text-sm font-medium text-white">基础信息</h4>
            <div className="mt-4 space-y-3 text-sm text-white/65">
              <div>Slug：{tool.slug}</div>
              <div>分类：{tool.category_name}</div>
              <div>状态：{tool.status}</div>
              <div>
                官网：
                <a
                  href={tool.website_url}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-1 text-white underline underline-offset-4"
                >
                  {tool.website_url}
                </a>
              </div>
            </div>
          </section>

          {tool.logo_url ? (
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h4 className="text-sm font-medium text-white">工具 Logo</h4>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={tool.logo_url}
                alt={`${tool.name} logo`}
                className="mt-4 max-h-48 rounded-xl object-contain"
              />
            </section>
          ) : null}

          {tool.cover_image_url ? (
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h4 className="text-sm font-medium text-white">工具预览图</h4>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={tool.cover_image_url}
                alt={`${tool.name} cover`}
                className="mt-4 rounded-xl object-cover"
              />
            </section>
          ) : null}
        </div>
      </div>
    </section>
  );
}
