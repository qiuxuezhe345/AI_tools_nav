import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Home() {
  return (
    <main className="flex min-h-[calc(100vh-12rem)] items-center justify-center px-4">
      <section className="w-full max-w-xl rounded-2xl border border-border/60 bg-background/95 p-8 shadow-sm">
        <div className="space-y-4 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
            Dirs Admin
          </p>
          <h1 className="text-3xl font-semibold text-foreground">
            后台管理入口
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            首页仅用于跳转。普通用户可以注册账号，但只有已加入
            `admin_users`
            的管理员才能登录后台。
          </p>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <Link href="/sign-in">前往登录</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/sign-up">前往注册</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
