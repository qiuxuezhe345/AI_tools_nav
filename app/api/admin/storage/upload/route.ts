import { createAdminClient } from "@/utils/supabase/admin";
import { isAdminUser } from "@/utils/supabase/admin-users";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

const bucketRules = {
  "tool-logos": {
    maxSize: 2 * 1024 * 1024,
    mimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/svg+xml",
    ],
  },
  "tool-covers": {
    maxSize: 5 * 1024 * 1024,
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
} as const;

type BucketName = keyof typeof bucketRules;

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
        { message: "当前账号不是管理员，无法上传文件" },
        { status: 403 },
      ),
      user: null,
    };
  }

  return { error: null, user };
}

function getFileExtension(fileName: string) {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop()?.toLowerCase() ?? "bin" : "bin";
}

export async function POST(request: Request) {
  const auth = await requireAdmin();

  if (auth.error || !auth.user) {
    return auth.error;
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const bucket = formData.get("bucket");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "请选择要上传的文件" }, { status: 400 });
  }

  if (typeof bucket !== "string" || !(bucket in bucketRules)) {
    return NextResponse.json({ message: "上传目标 bucket 不合法" }, { status: 400 });
  }

  const bucketName = bucket as BucketName;
  const rule = bucketRules[bucketName];

  if (!(rule.mimeTypes as readonly string[]).includes(file.type)) {
    return NextResponse.json({ message: "文件格式不支持" }, { status: 400 });
  }

  if (file.size > rule.maxSize) {
    return NextResponse.json({ message: "文件大小超出限制" }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const extension = getFileExtension(file.name);
  const filePath = `${auth.user.id}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const arrayBuffer = await file.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);

  const { error } = await adminClient.storage
    .from(bucketName)
    .upload(filePath, fileBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return NextResponse.json({ message: "文件上传失败" }, { status: 500 });
  }

  const { data } = adminClient.storage.from(bucketName).getPublicUrl(filePath);

  return NextResponse.json({
    url: data.publicUrl,
    path: filePath,
    bucket: bucketName,
  });
}
