import { isAdminUser } from "@/utils/supabase/admin-users";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

type ToolRow = {
  id: number;
  name: string;
  slug: string;
  category_id: number | null;
  website_url: string | null;
  is_hot: boolean | null;
  is_new: boolean | null;
  status: string | null;
  published_at: string | null;
  created_at: string | null;
};

type CategoryRow = {
  id: number;
  name: string;
};

type SubmissionRow = {
  id: number;
  name: string;
  slug: string;
  website_url: string | null;
  status: string | null;
  created_at: string | null;
};

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ message: "请先登录" }, { status: 401 });
  }

  const isAdmin = await isAdminUser(user.id);

  if (!isAdmin) {
    return NextResponse.json(
      { message: "当前账号不是管理员，无法访问后台数据" },
      { status: 403 },
    );
  }

  const adminClient = createAdminClient();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    toolsCountResult,
    categoriesCountResult,
    todaySubmissionsCountResult,
    pendingCountResult,
    toolsResult,
    categoriesResult,
    pendingSubmissionsResult,
  ] = await Promise.all([
    adminClient.from("ai_tools").select("id", { count: "exact", head: true }),
    adminClient
      .from("tool_categories")
      .select("id", { count: "exact", head: true }),
    adminClient
      .from("tool_submissions")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startOfToday.toISOString()),
    adminClient
      .from("tool_submissions")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    adminClient
      .from("ai_tools")
      .select(
        "id, name, slug, category_id, website_url, is_hot, is_new, status, published_at, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(8),
    adminClient.from("tool_categories").select("id, name"),
    adminClient
      .from("tool_submissions")
      .select("id, name, slug, website_url, status, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const categories = (categoriesResult.data ?? []) as CategoryRow[];
  const categoryMap = new Map(categories.map((category) => [category.id, category.name]));

  const tools = ((toolsResult.data ?? []) as ToolRow[]).map((tool) => ({
    ...tool,
    category_name: tool.category_id ? categoryMap.get(tool.category_id) ?? "未分类" : "未分类",
  }));

  const pendingSubmissions = (pendingSubmissionsResult.data ?? []) as SubmissionRow[];

  return NextResponse.json({
    current_admin: {
      id: user.id,
      email: user.email,
    },
    stats: {
      tools_count: toolsCountResult.count ?? 0,
      categories_count: categoriesCountResult.count ?? 0,
      today_submissions_count: todaySubmissionsCountResult.count ?? 0,
      pending_submissions_count: pendingCountResult.count ?? 0,
    },
    tools,
    pending_submissions: pendingSubmissions,
  });
}
