import { createAdminClient } from "@/utils/supabase/admin";
import { isAdminUser } from "@/utils/supabase/admin-users";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

type ReviewActionPayload = {
  action?: "approve" | "reject";
  review_notes?: string;
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
        { message: "当前账号不是管理员，无法审核提交" },
        { status: 403 },
      ),
      user: null,
    };
  }

  return { error: null, user };
}

function parseId(value: string) {
  const id = Number(value);
  return Number.isFinite(id) ? id : null;
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
  const submissionId = parseId(rawId);

  if (!submissionId) {
    return NextResponse.json({ message: "提交 ID 不合法" }, { status: 400 });
  }

  const payload = (await request.json()) as ReviewActionPayload;

  if (payload.action !== "approve" && payload.action !== "reject") {
    return NextResponse.json({ message: "审核动作不合法" }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const { data: submission, error: submissionError } = await adminClient
    .from("tool_submissions")
    .select(
      "id, category_id, name, slug, website_url, logo_url, cover_image_url, short_description, content, status",
    )
    .eq("id", submissionId)
    .maybeSingle();

  if (submissionError) {
    return NextResponse.json({ message: "读取提交详情失败" }, { status: 500 });
  }

  if (!submission) {
    return NextResponse.json({ message: "提交记录不存在" }, { status: 404 });
  }

  if (submission.status !== "pending") {
    return NextResponse.json({ message: "该提交已处理，请刷新列表" }, { status: 400 });
  }

  const reviewedAt = new Date().toISOString();

  if (payload.action === "reject") {
    const { error } = await adminClient
      .from("tool_submissions")
      .update({
        status: "rejected",
        review_notes: payload.review_notes?.trim() || null,
        reviewed_at: reviewedAt,
      })
      .eq("id", submissionId);

    if (error) {
      return NextResponse.json({ message: "驳回失败" }, { status: 500 });
    }

    return NextResponse.json({ message: "已驳回该提交" });
  }

  const { data: existingTool } = await adminClient
    .from("ai_tools")
    .select("id")
    .eq("slug", submission.slug)
    .maybeSingle();

  if (existingTool) {
    return NextResponse.json(
      { message: "该提交的 slug 已存在于 ai_tools，无法通过审核" },
      { status: 400 },
    );
  }

  const { data: insertedTool, error: insertError } = await adminClient
    .from("ai_tools")
    .insert({
      category_id: submission.category_id,
      name: submission.name,
      slug: submission.slug,
      website_url: submission.website_url,
      logo_url: submission.logo_url,
      cover_image_url: submission.cover_image_url,
      short_description: submission.short_description,
      content: submission.content,
      status: "published",
      published_at: reviewedAt,
      source_submission_id: submission.id,
    })
    .select("id")
    .single();

  if (insertError || !insertedTool) {
    return NextResponse.json({ message: "写入 ai_tools 失败" }, { status: 500 });
  }

  const { error: updateError } = await adminClient
    .from("tool_submissions")
    .update({
      status: "approved",
      approved_tool_id: insertedTool.id,
      reviewed_at: reviewedAt,
      review_notes: payload.review_notes?.trim() || null,
    })
    .eq("id", submissionId);

  if (updateError) {
    await adminClient.from("ai_tools").delete().eq("id", insertedTool.id);
    return NextResponse.json(
      { message: "更新 tool_submissions 状态失败" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    message: "审核通过，已写入 ai_tools",
    approved_tool_id: insertedTool.id,
  });
}
