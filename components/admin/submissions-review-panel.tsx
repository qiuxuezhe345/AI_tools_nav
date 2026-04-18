"use client";

import { Button } from "@/components/ui/button";
import { renderMarkdown } from "@/lib/markdown";
import type { AdminSubmission } from "@/lib/admin-submissions";
import { Eye, X } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  submissions: AdminSubmission[];
};

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

export function SubmissionsReviewPanel({ submissions }: Props) {
  const router = useRouter();
  const [selectedSubmission, setSelectedSubmission] =
    useState<AdminSubmission | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [pendingAction, setPendingAction] = useState<"approve" | "reject" | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  const previewHtml = useMemo(() => {
    return renderMarkdown(selectedSubmission?.content ?? "");
  }, [selectedSubmission]);

  async function reviewSubmission(id: number, action: "approve" | "reject") {
    setFeedback(null);
    setErrorMessage(null);
    setPendingId(id);
    setPendingAction(action);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/submissions/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            review_notes: reviewNotes,
          }),
        });

        const result = (await response.json()) as { message?: string };

        if (!response.ok) {
          throw new Error(result.message ?? "审核失败");
        }

        setFeedback(result.message ?? "操作成功");
        setSelectedSubmission(null);
        setReviewNotes("");
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "审核失败，请稍后再试",
        );
      } finally {
        setPendingId(null);
        setPendingAction(null);
      }
    });
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">审核中心</h2>
          <p className="text-sm text-white/60">
            默认展示所有待审核提交。管理员可以查看详情、通过审核或驳回提交。
          </p>
        </div>
        <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
          待审核 {submissions.length} 条
        </div>
      </div>

      {feedback ? (
        <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {feedback}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {errorMessage}
        </div>
      ) : null}

      {submissions.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-white/[0.03] text-white/55">
              <tr>
                <th className="px-4 py-3 font-medium">名称</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">分类</th>
                <th className="px-4 py-3 font-medium">官网</th>
                <th className="px-4 py-3 font-medium">提交时间</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((item) => {
                const currentPending =
                  isPending && pendingId === item.id ? pendingAction : null;

                return (
                  <tr key={item.id} className="border-t border-white/10">
                    <td className="px-4 py-3 font-medium text-white">{item.name}</td>
                    <td className="px-4 py-3 text-white/60">{item.slug}</td>
                    <td className="px-4 py-3 text-white/60">{item.category_name}</td>
                    <td className="px-4 py-3">
                      <a
                        href={item.website_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-white underline underline-offset-4"
                      >
                        打开官网
                      </a>
                    </td>
                    <td className="px-4 py-3 text-white/60">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 rounded-full border-white/15 bg-transparent text-white hover:bg-white hover:text-black"
                          title="查看详情"
                          aria-label="查看详情"
                          onClick={() => {
                            setSelectedSubmission(item);
                            setReviewNotes(item.review_notes ?? "");
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          className="h-10 min-w-[96px] justify-center bg-white text-black hover:bg-white/90"
                          disabled={Boolean(currentPending)}
                          onClick={() => reviewSubmission(item.id, "approve")}
                        >
                          {currentPending === "approve" ? "通过中..." : "通过"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 min-w-[96px] justify-center border-rose-500/30 bg-transparent text-rose-200 hover:bg-rose-500 hover:text-white"
                          disabled={Boolean(currentPending)}
                          onClick={() => {
                            setSelectedSubmission(item);
                            setReviewNotes(item.review_notes ?? "");
                          }}
                        >
                          驳回
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/15 px-5 py-10 text-center text-sm text-white/60">
          当前没有待审核提交，审核列表为空。
        </div>
      )}

      {selectedSubmission ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-semibold text-white">
                  {selectedSubmission.name}
                </h3>
                <p className="mt-2 text-sm text-white/60">
                  分类：{selectedSubmission.category_name} · 提交时间：
                  {formatDate(selectedSubmission.created_at)}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full border-white/15 bg-transparent text-white hover:bg-white hover:text-black"
                onClick={() => {
                  setSelectedSubmission(null);
                  setReviewNotes("");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-6">
                <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <h4 className="text-sm font-medium text-white">简短描述</h4>
                  <p className="mt-3 text-sm leading-7 text-white/70">
                    {selectedSubmission.short_description}
                  </p>
                </section>

                <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <h4 className="text-sm font-medium text-white">详细介绍</h4>
                  <div
                    className="markdown-preview mt-4 text-sm leading-7 text-white/80"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                </section>
              </div>

              <div className="space-y-6">
                <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <h4 className="text-sm font-medium text-white">基础信息</h4>
                  <div className="mt-4 space-y-3 text-sm text-white/65">
                    <div>Slug：{selectedSubmission.slug}</div>
                    <div>
                      官网：
                      <a
                        href={selectedSubmission.website_url}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-1 text-white underline underline-offset-4"
                      >
                        {selectedSubmission.website_url}
                      </a>
                    </div>
                    <div>状态：{selectedSubmission.status}</div>
                    <div>提交用户：{selectedSubmission.user_id}</div>
                  </div>
                </section>

                {selectedSubmission.logo_url ? (
                  <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <h4 className="text-sm font-medium text-white">工具 Logo</h4>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedSubmission.logo_url}
                      alt={`${selectedSubmission.name} logo`}
                      className="mt-4 max-h-48 rounded-xl object-contain"
                    />
                  </section>
                ) : null}

                {selectedSubmission.cover_image_url ? (
                  <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <h4 className="text-sm font-medium text-white">工具预览图</h4>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedSubmission.cover_image_url}
                      alt={`${selectedSubmission.name} cover`}
                      className="mt-4 rounded-xl object-cover"
                    />
                  </section>
                ) : null}
              </div>
            </div>

            <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <label className="text-sm font-medium text-white">
                驳回原因 / 审核备注
              </label>
              <textarea
                value={reviewNotes}
                onChange={(event) => setReviewNotes(event.target.value)}
                placeholder="填写驳回原因或审核备注（可选）"
                rows={4}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/30"
              />
              <div className="flex flex-wrap justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/15 bg-transparent text-white hover:bg-white hover:text-black"
                  onClick={() => {
                    setSelectedSubmission(null);
                    setReviewNotes("");
                  }}
                >
                  取消
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-rose-500/30 bg-transparent text-rose-200 hover:bg-rose-500 hover:text-white"
                  disabled={isPending && pendingId === selectedSubmission.id}
                  onClick={() => reviewSubmission(selectedSubmission.id, "reject")}
                >
                  {isPending &&
                  pendingId === selectedSubmission.id &&
                  pendingAction === "reject"
                    ? "驳回中..."
                    : "确认驳回"}
                </Button>
                <Button
                  type="button"
                  className="bg-white text-black hover:bg-white/90"
                  disabled={isPending && pendingId === selectedSubmission.id}
                  onClick={() => reviewSubmission(selectedSubmission.id, "approve")}
                >
                  {isPending &&
                  pendingId === selectedSubmission.id &&
                  pendingAction === "approve"
                    ? "通过中..."
                    : "确认通过"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
