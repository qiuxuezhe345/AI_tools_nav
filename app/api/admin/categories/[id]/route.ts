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
  currentCategoryId: number,
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
  const { data: existingCategory, error: existingCategoryError } =
    await adminClient
      .from("tool_categories")
      .select("id")
      .eq("slug", slug)
      .neq("id", currentCategoryId)
      .maybeSingle();

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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();

  if (auth.error) {
    return auth.error;
  }

  const { id } = await params;
  const categoryId = Number(id);

  if (!Number.isInteger(categoryId)) {
    return NextResponse.json({ message: "无效的分类 ID" }, { status: 400 });
  }

  const payload = (await request.json()) as CategoryPayload;
  const validated = await validatePayload(payload, categoryId);

  if (validated.error) {
    return NextResponse.json({ message: validated.error }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("tool_categories")
    .update(validated.data)
    .eq("id", categoryId)
    .select("id, slug, name")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ message: "更新分类失败" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ message: "分类不存在" }, { status: 404 });
  }

  return NextResponse.json({
    message: "分类更新成功",
    category: data,
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();

  if (auth.error) {
    return auth.error;
  }

  const { id } = await params;
  const categoryId = Number(id);

  if (!Number.isInteger(categoryId)) {
    return NextResponse.json({ message: "无效的分类 ID" }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const [categoryResult, toolsResult, submissionsResult] = await Promise.all([
    adminClient
      .from("tool_categories")
      .select("id")
      .eq("id", categoryId)
      .maybeSingle(),
    adminClient
      .from("ai_tools")
      .select("id", { count: "exact", head: true })
      .eq("category_id", categoryId),
    adminClient
      .from("tool_submissions")
      .select("id", { count: "exact", head: true })
      .eq("category_id", categoryId),
  ]);

  if (categoryResult.error || toolsResult.error || submissionsResult.error) {
    return NextResponse.json({ message: "读取分类信息失败" }, { status: 500 });
  }

  if (!categoryResult.data) {
    return NextResponse.json({ message: "分类不存在" }, { status: 404 });
  }

  if ((toolsResult.count ?? 0) > 0 || (submissionsResult.count ?? 0) > 0) {
    return NextResponse.json(
      {
        message:
          "该分类已经关联工具或用户提交，暂时不能删除。请先处理关联数据后再试。",
      },
      { status: 400 },
    );
  }

  const { error } = await adminClient
    .from("tool_categories")
    .delete()
    .eq("id", categoryId);

  if (error) {
    return NextResponse.json({ message: "删除分类失败" }, { status: 500 });
  }

  return NextResponse.json({ message: "分类删除成功" });
}
