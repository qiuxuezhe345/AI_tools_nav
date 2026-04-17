import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function Login(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;

  return (
    <form className="flex flex-col gap-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-medium">管理员登录</h1>
        <p className="text-sm text-muted-foreground">
          还没有账号？
          <Link className="ml-1 font-medium underline" href="/sign-up">
            前往注册
          </Link>
        </p>
      </div>

      <div className="flex flex-col gap-2 [&>input]:mb-3">
        <Label htmlFor="email">邮箱</Label>
        <Input name="email" placeholder="you@example.com" required />

        <div className="flex items-center justify-between">
          <Label htmlFor="password">密码</Label>
          <Link className="text-xs underline" href="/forgot-password">
            忘记密码？
          </Link>
        </div>

        <Input
          type="password"
          name="password"
          placeholder="请输入密码"
          required
        />

        <SubmitButton pendingText="登录中..." formAction={signInAction}>
          登录后台
        </SubmitButton>

        <FormMessage message={searchParams} />
      </div>
    </form>
  );
}
