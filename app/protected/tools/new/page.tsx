import { ToolCreateForm } from "@/components/admin/tool-create-form";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

type CategoriesResponse = {
  categories: Array<{
    id: number;
    name: string;
    slug: string;
    is_active: boolean;
    sort_order: number;
  }>;
};

async function getCategories() {
  const headerStore = await headers();
  const host = headerStore.get("host");
  const cookie = headerStore.get("cookie") ?? "";
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";

  if (!host) {
    throw new Error("无法获取当前请求地址");
  }

  const response = await fetch(`${protocol}://${host}/api/admin/tool-categories`, {
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

  return (await response.json()) as CategoriesResponse;
}

export default async function NewToolPage() {
  const data = await getCategories();

  return <ToolCreateForm categories={data.categories} />;
}
