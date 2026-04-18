import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NewToolPage() {
  return (
    <section className="rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">添加 AI 工具</h2>
          <p className="mt-2 text-sm leading-6 text-white/60">
            这里将用于创建新的 AI 工具。下一步可以继续按 PRD 接入新增工具表单、字段校验和提交写入逻辑。
          </p>
        </div>

        <div className="rounded-2xl border border-dashed border-white/15 px-5 py-10 text-center text-sm text-white/60">
          新增工具表单尚未接入，这里先提供独立入口页面，便于后续继续实现完整创建流程。
        </div>

        <div>
          <Button
            asChild
            variant="outline"
            className="border-white/15 bg-transparent text-white hover:bg-white hover:text-black"
          >
            <Link href="/protected/tools">返回 AI 工具管理</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
