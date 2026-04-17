import { forgotPasswordAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { SmtpMessage } from "../smtp-message";

export default async function ForgotPassword(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;

  return (
    <>
      <form className="flex flex-col gap-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-medium">找回密码</h1>
          <p className="text-sm text-muted-foreground">
            想起密码了？
            <Link className="ml-1 underline" href="/sign-in">
              返回登录
            </Link>
          </p>
        </div>

        <div className="flex flex-col gap-2 [&>input]:mb-3">
          <Label htmlFor="email">邮箱</Label>
          <Input name="email" placeholder="you@example.com" required />

          <SubmitButton formAction={forgotPasswordAction}>
            发送重置邮件
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
