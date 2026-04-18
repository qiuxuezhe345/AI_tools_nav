import { headers } from "next/headers";
import { redirect } from "next/navigation";

export type OverviewResponse = {
  current_admin: {
    id: string;
    email?: string;
  };
  stats: {
    tools_count: number;
    categories_count: number;
    today_submissions_count: number;
    pending_submissions_count: number;
  };
  tools: Array<{
    id: number;
    name: string;
    slug: string;
    category_name: string;
    website_url: string | null;
    is_hot: boolean | null;
    is_new: boolean | null;
    status: string | null;
    published_at: string | null;
    created_at: string | null;
  }>;
  pending_submissions: Array<{
    id: number;
    name: string;
    slug: string;
    website_url: string | null;
    status: string | null;
    created_at: string | null;
  }>;
};

export const cardItems = [
  {
    key: "tools_count",
    label: "AI 工具总数",
    hint: "正式工具表 ai_tools",
  },
  {
    key: "categories_count",
    label: "分类总数",
    hint: "工具分类表 tool_categories",
  },
  {
    key: "today_submissions_count",
    label: "今日提交数",
    hint: "当天新增的用户提交",
  },
  {
    key: "pending_submissions_count",
    label: "待审核数",
    hint: "status = pending",
  },
] as const;

export function formatDate(value: string | null) {
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

export async function getOverview() {
  const headerStore = await headers();
  const host = headerStore.get("host");
  const cookie = headerStore.get("cookie") ?? "";
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";

  if (!host) {
    throw new Error("无法获取当前请求地址");
  }

  const response = await fetch(`${protocol}://${host}/api/admin/overview`, {
    headers: {
      cookie,
    },
    cache: "no-store",
  });

  if (response.status === 401 || response.status === 403) {
    redirect("/sign-in?error=当前账号没有后台访问权限");
  }

  if (!response.ok) {
    throw new Error("后台数据加载失败");
  }

  return (await response.json()) as OverviewResponse;
}
