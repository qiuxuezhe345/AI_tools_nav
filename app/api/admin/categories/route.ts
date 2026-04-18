import { createAdminClient } from "@/utils/supabase/admin";
import { isAdminUser } from "@/utils/supabase/admin-users";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

type CategoryPayload = {
  slug?: string;
  name?: string;
  icon?: string | null;
  sort_order?: number;
  is_active?: boolean;
};

type CategoryRow = {
  id: number;
  slug: string;
  name: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
};

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
        { message: "当前账号不是管理员，无法管理工具分类" },
        { status: 403 },
      ),
      user: null,
    };
  }

  return { error: null, user };
}

function isValidSlug(slug: string) {
  return /^[a-z0-9-]+$/.test(slug);
}

async function validatePayload(
  payload: CategoryPayload,
  currentCategoryId?: number,
) {
  const slug = payload.slug?.trim() ?? "";
  const name = payload.name?.trim() ?? "";
  const icon = payload.icon?.trim() || null;
  const sortOrder = Number(payload.sort_order ?? 0);
  const isActive = payload.is_active ?? true;

  if (!name) {
    return { error: "分类名称不能为空" };
  }

  if (!slug) {
    return { error: "分类标识不能为空" };
  }

  if (!isValidSlug(slug)) {
    return { error: "分类标识只能包含小写字母、数字和连字符" };
  }

  if (!Number.isFinite(sortOrder)) {
    return { error: "排序值必须是数字" };
  }

  const adminClient = createAdminClient();
  const slugQuery = adminClient
    .from("tool_categories")
    .select("id")
    .eq("slug", slug);

  if (currentCategoryId) {
    slugQuery.neq("id", currentCategoryId);
  }

  const { data: existingCategory, error: existingCategoryError } =
    await slugQuery.maybeSingle();

  if (existingCategoryError) {
    return { error: "分类校验失败，请稍后重试" };
  }

  if (existingCategory) {
    return { error: "该分类标识已存在，请更换后重试" };
  }

  return {
    data: {
      slug,
      name,
      icon,
      sort_order: sortOrder,
      is_active: Boolean(isActive),
    },
  };
}

function countByCategoryId(rows: Array<{ category_id: number | null }>) {
  return rows.reduce<Map<number, number>>((map, row) => {
    if (typeof row.category_id !== "number") {
      return map;
    }

    map.set(row.category_id, (map.get(row.category_id) ?? 0) + 1);
    return map;
  }, new Map<number, number>());
}

export async function GET() {
  const auth = await requireAdmin();

  if (auth.error) {
    return auth.error;
  }

  const adminClient = createAdminClient();
  const [categoriesResult, toolsResult, submissionsResult] = await Promise.all([
    adminClient
      .from("tool_categories")
      .select("id, slug, name, icon, sort_order, is_active, created_at, updated_at")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    adminClient.from("ai_tools").select("category_id"),
    adminClient.from("tool_submissions").select("category_id"),
  ]);

  if (categoriesResult.error || toolsResult.error || submissionsResult.error) {
    return NextResponse.json({ message: "分类列表加载失败" }, { status: 500 });
  }

  const toolsCountMap = countByCategoryId(
    (toolsResult.data ?? []) as Array<{ category_id: number | null }>,
  );
  const submissionsCountMap = countByCategoryId(
    (submissionsResult.data ?? []) as Array<{ category_id: number | null }>,
  );

  const categories = ((categoriesResult.data ?? []) as CategoryRow[]).map(
    (category) => ({
      ...category,
      tools_count: toolsCountMap.get(category.id) ?? 0,
      submissions_count: submissionsCountMap.get(category.id) ?? 0,
    }),
  );

  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();

  if (auth.error) {
    return auth.error;
  }

  const payload = (await request.json()) as CategoryPayload;
  const validated = await validatePayload(payload);

  if (validated.error) {
    return NextResponse.json({ message: validated.error }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("tool_categories")
    .insert(validated.data)
    .select("id, slug, name")
    .single();

  if (error) {
    return NextResponse.json({ message: "创建分类失败" }, { status: 500 });
  }

  return NextResponse.json({
    message: "分类创建成功",
    category: data,
  });
}
