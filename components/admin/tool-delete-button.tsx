"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function ToolDeleteButton({ toolId }: { toolId: number }) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleDelete() {
    setErrorMessage(null);

    const confirmed = window.confirm("确认删除这个 AI 工具吗？此操作不可撤销。");
    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/tools/${toolId}`, {
          method: "DELETE",
        });

        const result = (await response.json()) as { message?: string };

        if (!response.ok) {
          throw new Error(result.message ?? "删除失败");
        }

        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "删除失败，请稍后再试",
        );
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        type="button"
        variant="destructive"
        size="icon"
        className="h-9 w-9 rounded-full"
        disabled={isPending}
        onClick={handleDelete}
        title="删除"
        aria-label="删除"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      {errorMessage ? (
        <div className="text-xs text-rose-300">{errorMessage}</div>
      ) : null}
    </div>
  );
}
