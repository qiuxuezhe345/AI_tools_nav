import { getOverview } from "@/lib/admin-dashboard";

export default async function UsersPage() {
  const overview = await getOverview();

  return (
    <section className="rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-white">用户管理</h2>
        <p className="mt-2 text-sm leading-6 text-white/60">
          根据 PRD，用户管理页将负责查看用户、设置管理员身份、取消管理员权限，并防止误删最后一个管理员。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="text-sm text-white/55">当前管理员邮箱</div>
          <div className="mt-3 text-lg font-semibold text-white">
            {overview.current_admin.email ?? "未识别邮箱"}
          </div>
          <div className="mt-2 text-xs text-white/50">
            这里后续可以扩展管理员列表与权限切换操作。
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="text-sm text-white/55">待建设能力</div>
          <div className="mt-3 text-lg font-semibold text-white">
            设置管理员 / 取消管理员
          </div>
          <div className="mt-2 text-xs leading-5 text-white/50">
            后续建议补充用户列表、管理员开关，以及“禁止删除最后一个管理员”的安全校验。
          </div>
        </article>
      </div>
    </section>
  );
}
