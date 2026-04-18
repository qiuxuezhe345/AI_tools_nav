import { headers } from "next/headers";
import { redirect } from "next/navigation";

export type AdminSubmission = {
  id: number;
  user_id: string;
  category_id: number;
  category_name: string;
  name: string;
  slug: string;
  website_url: string;
  logo_url: string | null;
  cover_image_url: string | null;
  short_description: string;
  content: string | null;
  status: "pending" | "approved" | "rejected";
  review_notes: string | null;
  reviewed_at: string | null;
  approved_tool_id: number | null;
  created_at: string | null;
  updated_at: string | null;
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
    throw new Error("审核数据加载失败");
  }

  return (await response.json()) as T;
}

export async function getPendingSubmissions() {
  const response = await fetchAdminJson<{ submissions: AdminSubmission[] }>(
    "/api/admin/submissions",
  );

  return response.submissions;
}
