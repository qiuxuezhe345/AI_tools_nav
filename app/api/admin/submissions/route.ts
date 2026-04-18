import { createAdminClient } from "@/utils/supabase/admin";
import { isAdminUser } from "@/utils/supabase/admin-users";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      error: NextResponse.json({ message: "请先登录" }, { status: 401 }),
      user: null,
    };
  }

  const isAdmin = await isAdminUser(user.id);

  if (!isAdmin) {
    return {
      error: NextResponse.json(
        { message: "当前账号不是管理员，无法访问审核接口" },
        { status: 403 },
      ),
      user: null,
    };
  }

  return { error: null, user };
}

export async function GET() {
  const auth = await requireAdmin();

  if (auth.error) {
    return auth.error;
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("tool_submissions")
    .select(
      "id, user_id, category_id, name, slug, website_url, logo_url, cover_image_url, short_description, content, status, review_notes, reviewed_at, approved_tool_id, created_at, updated_at, tool_categories(name)",
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ message: "待审核列表加载失败" }, { status: 500 });
  }

  const submissions = (data ?? []).map((item: any) => ({
    id: item.id,
    user_id: item.user_id,
    category_id: item.category_id,
    name: item.name,
    slug: item.slug,
    website_url: item.website_url,
    logo_url: item.logo_url,
    cover_image_url: item.cover_image_url,
    short_description: item.short_description,
    content: item.content,
    status: item.status,
    review_notes: item.review_notes,
    reviewed_at: item.reviewed_at,
    approved_tool_id: item.approved_tool_id,
    created_at: item.created_at,
    updated_at: item.updated_at,
    category_name: Array.isArray(item.tool_categories)
      ? item.tool_categories[0]?.name ?? "未分类"
      : item.tool_categories?.name ?? "未分类",
  }));

  return NextResponse.json({ submissions });
}
