import { createAdminClient } from "@/utils/supabase/admin";
import { isAdminUser } from "@/utils/supabase/admin-users";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

type ToolPayload = {
  category_id?: number;
  name?: string;
  slug?: string;
  website_url?: string;
  logo_url?: string | null;
  cover_image_url?: string | null;
  short_description?: string;
  content?: string | null;
  is_hot?: boolean;
  is_new?: boolean;
  status?: "published" | "hidden";
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
        { message: "当前账号不是管理员，无法管理 AI 工具" },
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

function isValidUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

async function getToolById(id: number) {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("ai_tools")
    .select(
      "id, category_id, name, slug, website_url, logo_url, cover_image_url, short_description, content, is_hot, is_new, status, published_at, created_at, updated_at, tool_categories(name)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return { error: "读取工具详情失败", data: null };
  }

  if (!data) {
    return { error: "工具不存在", data: null };
  }

  return {
    error: null,
    data: {
      id: data.id,
      category_id: data.category_id,
      name: data.name,
      slug: data.slug,
      website_url: data.website_url,
      logo_url: data.logo_url,
      cover_image_url: data.cover_image_url,
      short_description: data.short_description,
      content: data.content,
      is_hot: data.is_hot,
      is_new: data.is_new,
      status: data.status,
      published_at: data.published_at,
      created_at: data.created_at,
      updated_at: data.updated_at,
      category_name:
        Array.isArray((data as any).tool_categories)
          ? (data as any).tool_categories[0]?.name ?? "未分类"
          : (data as any).tool_categories?.name ?? "未分类",
    },
  };
}

async function validatePayload(payload: ToolPayload, toolId: number) {
  const adminClient = createAdminClient();
  const categoryId = Number(payload.category_id);
  const name = payload.name?.trim() ?? "";
  const slug = payload.slug?.trim() ?? "";
  const websiteUrl = payload.website_url?.trim() ?? "";
  const shortDescription = payload.short_description?.trim() ?? "";
  const content = payload.content?.trim() ?? "";
  const logoUrl = payload.logo_url?.trim() || null;
  const coverImageUrl = payload.cover_image_url?.trim() || null;
  const isHot = Boolean(payload.is_hot);
  const isNew = Boolean(payload.is_new);
  const status = payload.status === "hidden" ? "hidden" : "published";

  if (!name) {
    return { error: "工具名称不能为空" };
  }

  if (!slug) {
    return { error: "URL 标识不能为空" };
  }

  if (!isValidSlug(slug)) {
    return { error: "URL 标识只能包含小写字母、数字和连字符" };
  }

  if (!shortDescription) {
    return { error: "简短描述不能为空" };
  }

  if (shortDescription.length > 300) {
    return { error: "简短描述不能超过 300 个字符" };
  }

  if (!websiteUrl || !isValidUrl(websiteUrl)) {
    return { error: "网站地址不能为空且必须是有效链接" };
  }

  if (!Number.isFinite(categoryId)) {
    return { error: "请选择有效分类" };
  }

  const [{ data: category }, { data: existingTool }, { data: existingSubmission }] =
    await Promise.all([
      adminClient
        .from("tool_categories")
        .select("id")
        .eq("id", categoryId)
        .eq("is_active", true)
        .maybeSingle(),
      adminClient
        .from("ai_tools")
        .select("id")
        .eq("slug", slug)
        .neq("id", toolId)
        .maybeSingle(),
      adminClient
        .from("tool_submissions")
        .select("id")
        .eq("slug", slug)
        .maybeSingle(),
    ]);

  if (!category) {
    return { error: "所选分类不存在或已停用" };
  }

  if (existingTool || existingSubmission) {
    return { error: "该 URL 标识已存在，请更换" };
  }

  return {
    data: {
      category_id: categoryId,
      name,
      slug,
      website_url: websiteUrl,
      logo_url: logoUrl,
      cover_image_url: coverImageUrl,
      short_description: shortDescription,
      content: content || null,
      is_hot: isHot,
      is_new: isNew,
      status,
    },
  };
}

function parseId(value: string) {
  const id = Number(value);
  return Number.isFinite(id) ? id : null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();

  if (auth.error) {
    return auth.error;
  }

  const { id: rawId } = await context.params;
  const id = parseId(rawId);

  if (!id) {
    return NextResponse.json({ message: "工具 ID 不合法" }, { status: 400 });
  }

  const tool = await getToolById(id);

  if (tool.error) {
    return NextResponse.json(
      { message: tool.error },
      { status: tool.error === "工具不存在" ? 404 : 500 },
    );
  }

  return NextResponse.json({ tool: tool.data });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();

  if (auth.error) {
    return auth.error;
  }

  const { id: rawId } = await context.params;
  const id = parseId(rawId);

  if (!id) {
    return NextResponse.json({ message: "工具 ID 不合法" }, { status: 400 });
  }

  const exists = await getToolById(id);

  if (exists.error) {
    return NextResponse.json(
      { message: exists.error },
      { status: exists.error === "工具不存在" ? 404 : 500 },
    );
  }

  const payload = (await request.json()) as ToolPayload;
  const validated = await validatePayload(payload, id);

  if (validated.error) {
    return NextResponse.json({ message: validated.error }, { status: 400 });
  }

  const toolData = validated.data!;

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("ai_tools")
    .update({
      ...toolData,
      published_at:
        toolData.status === "published"
          ? exists.data?.published_at ?? new Date().toISOString()
          : null,
    })
    .eq("id", id)
    .select("id, slug")
    .single();

  if (error) {
    return NextResponse.json({ message: "更新 AI 工具失败" }, { status: 500 });
  }

  return NextResponse.json({
    message: "AI 工具更新成功",
    tool: data,
  });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();

  if (auth.error) {
    return auth.error;
  }

  const { id: rawId } = await context.params;
  const id = parseId(rawId);

  if (!id) {
    return NextResponse.json({ message: "工具 ID 不合法" }, { status: 400 });
  }

  const exists = await getToolById(id);

  if (exists.error) {
    return NextResponse.json(
      { message: exists.error },
      { status: exists.error === "工具不存在" ? 404 : 500 },
    );
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient.from("ai_tools").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ message: "删除 AI 工具失败" }, { status: 500 });
  }

  return NextResponse.json({ message: "AI 工具已删除" });
}
