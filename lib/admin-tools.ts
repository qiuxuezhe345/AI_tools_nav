import { headers } from "next/headers";
import { redirect } from "next/navigation";

export type AdminToolCategory = {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  sort_order: number;
};

export type AdminTool = {
  id: number;
  category_id: number;
  category_name: string;
  name: string;
  slug: string;
  website_url: string;
  logo_url: string | null;
  cover_image_url: string | null;
  short_description: string;
  content: string | null;
  is_hot: boolean;
  is_new: boolean;
  status: "published" | "hidden";
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

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

async function fetchAdminJson<T>(path: string) {
  const headerStore = await headers();
  const host = headerStore.get("host");
  const cookie = headerStore.get("cookie") ?? "";
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";

  if (!host) {
    throw new Error("无法获取当前请求地址");
  }

  const response = await fetch(`${protocol}://${host}${path}`, {
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

  return (await response.json()) as T;
}

export async function getToolCategories() {
  const response = await fetchAdminJson<{ categories: AdminToolCategory[] }>(
    "/api/admin/tool-categories",
  );

  return response.categories;
}

export async function getTools() {
  const response = await fetchAdminJson<{ tools: AdminTool[] }>(
    "/api/admin/tools",
  );

  return response.tools;
}

export async function getToolById(id: string | number) {
  const response = await fetchAdminJson<{ tool: AdminTool }>(
    `/api/admin/tools/${id}`,
  );

  return response.tool;
}
