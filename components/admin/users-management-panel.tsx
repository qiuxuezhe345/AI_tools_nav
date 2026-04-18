"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

type UserRow = {
  id: string;
  email: string;
  created_at: string | null;
  last_sign_in_at: string | null;
  is_admin: boolean;
  role: string | null;
  admin_created_at: string | null;
};

type Props = {
  adminCount: number;
  currentAdminId: string;
  totalUsers: number;
  users: UserRow[];
};

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function UsersManagementPanel({
  adminCount,
  currentAdminId,
  totalUsers,
  users,
}: Props) {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    userId: string;
    type: "grant" | "revoke";
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredUsers = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();

    if (!normalized) {
      return users;
    }

    return users.filter((user) => {
      return (
        user.email.toLowerCase().includes(normalized) ||
        user.id.toLowerCase().includes(normalized)
      );
    });
  }, [keyword, users]);

  async function updateAdmin(userId: string, type: "grant" | "revoke") {
    setMessage(null);
    setErrorMessage(null);
    setPendingAction({ userId, type });

    try {
      const response = await fetch("/api/admin/users", {
        method: type === "grant" ? "POST" : "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(result.message ?? "操作失败");
      }

      setMessage(result.message ?? "操作成功");
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "操作失败，请稍后再试",
      );
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">用户管理</h2>
          <p className="mt-2 text-sm leading-6 text-white/60">
            管理员可以查看平台注册用户，并决定谁可以进入后台。
            系统会阻止移除最后一个管理员，避免后台失控。
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="text-xs text-white/50">总用户数</div>
            <div className="mt-1 text-lg font-semibold text-white">
              {totalUsers}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="text-xs text-white/50">管理员数</div>
            <div className="mt-1 text-lg font-semibold text-white">
              {adminCount}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="按邮箱或用户 ID 搜索"
          className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/30 md:max-w-sm"
        />
        <div className="text-sm text-white/45">
          当前登录管理员 ID：{currentAdminId}
        </div>
      </div>

      {message ? (
        <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {errorMessage}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-white/[0.03] text-white/55">
            <tr>
              <th className="px-4 py-3 font-medium">邮箱</th>
              <th className="px-4 py-3 font-medium">用户 ID</th>
              <th className="px-4 py-3 font-medium">注册时间</th>
              <th className="px-4 py-3 font-medium">最近登录</th>
              <th className="px-4 py-3 font-medium">管理员状态</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => {
              const isCurrentUser = user.id === currentAdminId;
              const isBusy =
                isPending &&
                pendingAction?.userId === user.id;

              return (
                <tr key={user.id} className="border-t border-white/10">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{user.email}</div>
                    {isCurrentUser ? (
                      <div className="mt-1 text-xs text-white/45">当前登录账号</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-xs text-white/55">{user.id}</td>
                  <td className="px-4 py-3 text-white/60">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-4 py-3 text-white/60">
                    {formatDate(user.last_sign_in_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-medium",
                        user.is_admin
                          ? "bg-emerald-500/15 text-emerald-200"
                          : "bg-white/10 text-white/60",
                      )}
                    >
                      {user.is_admin ? `管理员${user.role ? ` / ${user.role}` : ""}` : "普通用户"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.is_admin ? (
                      <Button
                        variant="outline"
                        className="border-white/15 bg-transparent text-white hover:bg-white hover:text-black"
                        disabled={isBusy}
                        onClick={() => updateAdmin(user.id, "revoke")}
                      >
                        {isBusy ? "处理中..." : "取消管理员"}
                      </Button>
                    ) : (
                      <Button
                        className="bg-white text-black hover:bg-white/90"
                        disabled={isBusy}
                        onClick={() => updateAdmin(user.id, "grant")}
                      >
                        {isBusy ? "处理中..." : "设为管理员"}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-white/15 px-5 py-10 text-center text-sm text-white/55">
          没有匹配到用户，请调整搜索条件。
        </div>
      ) : null}
    </section>
  );
}
