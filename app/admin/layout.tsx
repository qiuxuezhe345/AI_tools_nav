import { signOutAction } from "@/app/actions";
import { TopNav } from "@/components/admin/top-nav";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.35em] text-white/45">
                  Dirs Admin
                </p>
                <h1 className="text-3xl font-semibold text-white">后台管理首页</h1>
                <p className="max-w-2xl text-sm leading-6 text-white/65">
                  顶部导航已切换为真实页面跳转，方便在概览、审核和用户管理之间切换。
                </p>
              </div>
              <TopNav />
            </div>

            <div className="flex flex-col items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 lg:items-end">
              <div className="text-sm text-white/55">当前管理员</div>
              <div className="text-base font-medium text-white">
                {user.email ?? "未识别邮箱"}
              </div>
              <form action={signOutAction}>
                <Button
                  type="submit"
                  variant="outline"
                  className="border-white/15 bg-transparent text-white hover:bg-white hover:text-black"
                >
                  退出登录
                </Button>
              </form>
            </div>
          </div>
        </header>

        {children}
      </div>
    </main>
  );
}
