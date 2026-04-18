import { formatDate, getOverview } from "@/lib/admin-dashboard";

export default async function ReviewPage() {
  const overview = await getOverview();

  return (
    <section className="rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">审核</h2>
          <p className="text-sm text-white/60">
            默认展示待审核提交，后续可以继续扩展通过/拒绝操作。
          </p>
        </div>
        <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
          待审核 {overview.stats.pending_submissions_count} 条
        </div>
      </div>

      {overview.pending_submissions.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-white/[0.03] text-white/55">
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
                <tr key={item.id} className="border-t border-white/10">
                  <td className="px-4 py-3 font-medium text-white">{item.name}</td>
                  <td className="px-4 py-3 text-white/60">{item.slug}</td>
                  <td className="px-4 py-3">
                    {item.website_url ? (
                      <a
                        href={item.website_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-white underline underline-offset-4"
                      >
                        打开官网
                      </a>
                    ) : (
                      <span className="text-white/40">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-white/60">
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
        <div className="rounded-2xl border border-dashed border-white/15 px-5 py-10 text-center text-sm text-white/60">
          当前没有待审核提交，审核列表为空。
        </div>
      )}
    </section>
  );
}
