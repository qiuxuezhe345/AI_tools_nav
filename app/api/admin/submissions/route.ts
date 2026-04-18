import { createAdminClient } from "@/utils/supabase/admin";
import { isAdminUser } from "@/utils/supabase/admin-users";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

const allowedStatuses = ["pending", "approved", "rejected"] as const;

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

export async function GET(request: Request) {
  const auth = await requireAdmin();

  if (auth.error) {
    return auth.error;
  }

  const requestUrl = new URL(request.url);
  const statusParam = requestUrl.searchParams.get("status") ?? "pending";

  if (!allowedStatuses.includes(statusParam as (typeof allowedStatuses)[number])) {
    return NextResponse.json({ message: "审核状态不合法" }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const [submissionsResult, pendingCountResult, approvedCountResult, rejectedCountResult] =
    await Promise.all([
      adminClient
        .from("tool_submissions")
        .select(
          "id, user_id, category_id, name, slug, website_url, logo_url, cover_image_url, short_description, content, status, review_notes, reviewed_at, approved_tool_id, created_at, updated_at, tool_categories(name)",
        )
        .eq("status", statusParam)
        .order("created_at", { ascending: false }),
      adminClient
        .from("tool_submissions")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      adminClient
        .from("tool_submissions")
        .select("id", { count: "exact", head: true })
        .eq("status", "approved"),
      adminClient
        .from("tool_submissions")
        .select("id", { count: "exact", head: true })
        .eq("status", "rejected"),
    ]);

  if (submissionsResult.error) {
    return NextResponse.json({ message: "审核列表加载失败" }, { status: 500 });
  }

  const submissions = ((submissionsResult.data ?? []) as any[]).map((item: any) => ({
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

  return NextResponse.json({
    submissions,
    counts: {
      pending: pendingCountResult.count ?? 0,
      approved: approvedCountResult.count ?? 0,
      rejected: rejectedCountResult.count ?? 0,
    },
  });
}
