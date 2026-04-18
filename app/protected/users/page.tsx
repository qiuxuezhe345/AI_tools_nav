import { UsersManagementPanel } from "@/components/admin/users-management-panel";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

type UsersResponse = {
  current_admin_id: string;
  total_users: number;
  admin_count: number;
  users: Array<{
    id: string;
    email: string;
    created_at: string | null;
    last_sign_in_at: string | null;
    is_admin: boolean;
    role: string | null;
    admin_created_at: string | null;
  }>;
};

async function getUsersManagementData() {
  const headerStore = await headers();
  const host = headerStore.get("host");
  const cookie = headerStore.get("cookie") ?? "";
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";

  if (!host) {
    throw new Error("无法获取当前请求地址");
  }

  const response = await fetch(`${protocol}://${host}/api/admin/users`, {
    headers: {
      cookie,
    },
    cache: "no-store",
  });

  if (response.status === 401 || response.status === 403) {
    redirect("/sign-in?error=当前账号没有后台访问权限");
  }

  if (!response.ok) {
    throw new Error("用户管理数据加载失败");
  }

  return (await response.json()) as UsersResponse;
}

export default async function UsersPage() {
  const data = await getUsersManagementData();

  return (
    <UsersManagementPanel
      adminCount={data.admin_count}
      currentAdminId={data.current_admin_id}
      totalUsers={data.total_users}
      users={data.users}
    />
  );
}
