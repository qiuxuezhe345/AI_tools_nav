import { ArrowUpRight, InfoIcon } from "lucide-react";
import Link from "next/link";

export function SmtpMessage() {
  return (
    <div className="flex gap-4 rounded-md border bg-muted/50 px-5 py-3">
      <InfoIcon size={16} className="mt-0.5" />
      <div className="flex flex-col gap-1">
        <small className="text-sm text-secondary-foreground">
          <strong>提示：</strong>
          默认邮件发送存在频率限制，如需更稳定发送邮件，可配置 Custom
          SMTP。
        </small>
        <div>
          <Link
            href="https://supabase.com/docs/guides/auth/auth-smtp"
            target="_blank"
            className="flex items-center gap-1 text-sm text-primary/50 hover:text-primary"
          >
            查看说明 <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
