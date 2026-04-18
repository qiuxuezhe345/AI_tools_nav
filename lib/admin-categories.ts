import { headers } from "next/headers";
import { redirect } from "next/navigation";

export type AdminCategory = {
  id: number;
  slug: string;
  name: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  tools_count: number;
  submissions_count: number;
};

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
    throw new Error("分类数据加载失败");
  }

  return (await response.json()) as T;
}

export async function getCategories() {
  const response = await fetchAdminJson<{ categories: AdminCategory[] }>(
    "/api/admin/categories",
  );

  return response.categories;
}
