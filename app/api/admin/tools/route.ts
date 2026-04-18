import { createAdminClient } from "@/utils/supabase/admin";
import { isAdminUser } from "@/utils/supabase/admin-users";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

type CreateToolPayload = {
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
        { message: "当前账号不是管理员，无法创建 AI 工具" },
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

export async function POST(request: Request) {
  const auth = await requireAdmin();

  if (auth.error) {
    return auth.error;
  }

  const payload = (await request.json()) as CreateToolPayload;
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
    return NextResponse.json({ message: "工具名称不能为空" }, { status: 400 });
  }

  if (!slug) {
    return NextResponse.json({ message: "URL 标识不能为空" }, { status: 400 });
  }

  if (!isValidSlug(slug)) {
    return NextResponse.json(
      { message: "URL 标识只能包含小写字母、数字和连字符" },
      { status: 400 },
    );
  }

  if (!shortDescription) {
    return NextResponse.json({ message: "简短描述不能为空" }, { status: 400 });
  }

  if (shortDescription.length > 300) {
    return NextResponse.json(
      { message: "简短描述不能超过 300 个字符" },
      { status: 400 },
    );
  }

  if (!websiteUrl || !isValidUrl(websiteUrl)) {
    return NextResponse.json(
      { message: "网站地址不能为空且必须是有效链接" },
      { status: 400 },
    );
  }

  if (!Number.isFinite(categoryId)) {
    return NextResponse.json({ message: "请选择有效分类" }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const [{ data: category }, { data: existingTool }, { data: existingSubmission }] =
    await Promise.all([
      adminClient
        .from("tool_categories")
        .select("id")
        .eq("id", categoryId)
        .eq("is_active", true)
        .maybeSingle(),
      adminClient.from("ai_tools").select("id").eq("slug", slug).maybeSingle(),
      adminClient
        .from("tool_submissions")
        .select("id")
        .eq("slug", slug)
        .maybeSingle(),
    ]);

  if (!category) {
    return NextResponse.json({ message: "所选分类不存在或已停用" }, { status: 400 });
  }

  if (existingTool || existingSubmission) {
    return NextResponse.json({ message: "该 URL 标识已存在，请更换" }, { status: 400 });
  }

  const { data, error } = await adminClient
    .from("ai_tools")
    .insert({
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
      published_at: status === "published" ? new Date().toISOString() : null,
    })
    .select("id, slug")
    .single();

  if (error) {
    return NextResponse.json({ message: "写入 AI 工具失败" }, { status: 500 });
  }

  return NextResponse.json({
    message: "AI 工具添加成功",
    tool: data,
  });
}
