import { signUpAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { SmtpMessage } from "../smtp-message";

export default async function Signup(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;

  if ("message" in searchParams) {
    return (
      <div className="flex items-center justify-center">
        <FormMessage message={searchParams} />
      </div>
    );
  }

  return (
    <>
      <form className="flex flex-col gap-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-medium">注册账号</h1>
          <p className="text-sm text-muted-foreground">
            已经有账号了？
            <Link className="ml-1 font-medium underline" href="/sign-in">
              前往登录
            </Link>
          </p>
          <p className="text-xs leading-5 text-muted-foreground">
            注册后默认为普通用户，只有管理员账号才能进入后台。
          </p>
        </div>

        <div className="flex flex-col gap-2 [&>input]:mb-3">
          <Label htmlFor="email">邮箱</Label>
          <Input name="email" placeholder="you@example.com" required />

          <Label htmlFor="password">密码</Label>
          <Input
            type="password"
            name="password"
            placeholder="请设置密码"
            minLength={6}
            required
          />

          <SubmitButton formAction={signUpAction} pendingText="注册中...">
            立即注册
          </SubmitButton>

          <FormMessage message={searchParams} />
        </div>
      </form>

      <div className="mt-6">
        <SmtpMessage />
      </div>
    </>
  );
}
