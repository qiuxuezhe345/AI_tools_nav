"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { renderMarkdown } from "@/lib/markdown";
import { cn } from "@/lib/utils";
import { Upload, ImageIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Category = {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  sort_order: number;
};

type Props = {
  categories: Category[];
};

type UploadFieldProps = {
  label: string;
  hint: string;
  bucket: "tool-logos" | "tool-covers";
  value: string;
  accept: string;
  onChange: (url: string) => void;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function UploadField({
  label,
  hint,
  bucket,
  value,
  accept,
  onChange,
}: UploadFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUploading, startTransition] = useTransition();

  function handleUpload(file: File) {
    setErrorMessage(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", bucket);

      try {
        const response = await fetch("/api/admin/storage/upload", {
          method: "POST",
          body: formData,
        });

        const result = (await response.json()) as {
          url?: string;
          message?: string;
        };

        if (!response.ok || !result.url) {
          throw new Error(result.message ?? "上传失败");
        }

        onChange(result.url);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "上传失败，请稍后再试",
        );
      }
    });
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="text-sm font-medium text-white">{label}</div>
        <div className="mt-1 text-sm text-white/55">{hint}</div>
      </div>

      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-5">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              handleUpload(file);
            }
          }}
        />

        <div className="flex flex-col items-center justify-center gap-3 text-center">
          {value ? (
            <div className="w-full overflow-hidden rounded-xl border border-white/10 bg-black/30 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt={label}
                className="mx-auto max-h-48 rounded-lg object-contain"
              />
            </div>
          ) : (
            <div className="rounded-full border border-white/10 bg-white/[0.04] p-4 text-white/70">
              <Upload className="h-7 w-7" />
            </div>
          )}

          <div className="text-sm text-white/60">
            拖放文件到此处，或点击按钮上传
          </div>

          <Button
            type="button"
            className="bg-white text-black hover:bg-white/90"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? "上传中..." : `上传${label}`}
          </Button>

          {value ? (
            <div className="break-all text-xs text-white/45">{value}</div>
          ) : null}

          {errorMessage ? (
            <div className="text-sm text-rose-300">{errorMessage}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function ToolCreateForm({ categories }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [content, setContent] = useState("");
  const [isHot, setIsHot] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [status, setStatus] = useState<"published" | "hidden">("published");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const previewHtml = useMemo(() => renderMarkdown(content), [content]);

  function handleNameChange(value: string) {
    setName(value);

    if (!slug.trim()) {
      setSlug(slugify(value));
    }
  }

  function handleSubmit() {
    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/tools", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            category_id: Number(categoryId),
            name,
            slug,
            website_url: websiteUrl,
            logo_url: logoUrl || null,
            cover_image_url: coverImageUrl || null,
            short_description: shortDescription,
            content,
            is_hot: isHot,
            is_new: isNew,
            status,
          }),
        });

        const result = (await response.json()) as {
          message?: string;
        };

        if (!response.ok) {
          throw new Error(result.message ?? "提交失败");
        }

        setSuccessMessage(result.message ?? "AI 工具添加成功");
        router.push("/protected/tools");
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "提交失败，请稍后再试",
        );
      }
    });
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">提交新工具</h2>
          <p className="mt-2 text-sm leading-6 text-white/60">
            提交后将直接写入 `ai_tools` 表。图片会上传到 Supabase Storage，
            Markdown 内容支持实时预览。
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          className="border-white/15 bg-transparent text-white hover:bg-white hover:text-black"
        >
          <Link href="/protected/tools">返回 AI 工具管理</Link>
        </Button>
      </div>

      <div className="space-y-8">
        <div className="space-y-2">
          <label className="text-sm font-medium text-white">工具名称</label>
          <input
            value={name}
            onChange={(event) => handleNameChange(event.target.value)}
            placeholder="例如：ChatGPT"
            className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/30"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-white">URL 标识</label>
          <p className="text-sm text-white/55">
            用于生成该工具的 URL 路径，仅允许小写字母、数字和连字符
          </p>
          <input
            value={slug}
            onChange={(event) => setSlug(slugify(event.target.value))}
            placeholder="例如：chatgpt"
            className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/30"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-white">简短描述</label>
          <textarea
            value={shortDescription}
            onChange={(event) => setShortDescription(event.target.value)}
            placeholder="简短描述工具的主要功能和特点（最多 300 个字符）"
            maxLength={300}
            rows={4}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/30"
          />
          <div className="text-right text-xs text-white/40">
            {shortDescription.length}/300
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-white">网站地址</label>
          <input
            value={websiteUrl}
            onChange={(event) => setWebsiteUrl(event.target.value)}
            placeholder="https://example.com"
            className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/30"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-white">分类</label>
          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none focus:border-white/30"
          >
            <option value="">选择分类</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id} className="text-black">
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <UploadField
          label="工具 Logo"
          hint="上传工具 Logo 图片，最大 2MB，支持 JPG、PNG、SVG 和 WebP 格式"
          bucket="tool-logos"
          value={logoUrl}
          accept=".jpg,.jpeg,.png,.svg,.webp"
          onChange={setLogoUrl}
        />

        <div className="space-y-3">
          <div>
            <div className="text-sm font-medium text-white">详细介绍（可选）</div>
            <div className="mt-1 text-sm text-white/55">
              支持 Markdown 格式，可以使用标题、列表、链接等丰富样式
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("edit")}
              className={cn(
                "rounded-lg px-4 py-2 text-sm transition",
                mode === "edit"
                  ? "bg-white text-black"
                  : "border border-white/10 bg-white/[0.03] text-white/70",
              )}
            >
              编辑
            </button>
            <button
              type="button"
              onClick={() => setMode("preview")}
              className={cn(
                "rounded-lg px-4 py-2 text-sm transition",
                mode === "preview"
                  ? "bg-white text-black"
                  : "border border-white/10 bg-white/[0.03] text-white/70",
              )}
            >
              预览
            </button>
          </div>

          {mode === "edit" ? (
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="详细介绍工具的功能、使用场景和优势，支持 Markdown 格式"
              rows={12}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/30"
            />
          ) : (
            <div
              className="markdown-preview min-h-[280px] rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm leading-7 text-white/80"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          )}
        </div>

        <UploadField
          label="工具预览图"
          hint="上传工具的预览图或截图，最大 5MB，支持 JPG、PNG 和 WebP 格式"
          bucket="tool-covers"
          value={coverImageUrl}
          accept=".jpg,.jpeg,.png,.webp"
          onChange={setCoverImageUrl}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white">
            <Checkbox checked={isHot} onCheckedChange={(checked) => setIsHot(Boolean(checked))} />
            设为热门工具
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white">
            <Checkbox checked={isNew} onCheckedChange={(checked) => setIsNew(Boolean(checked))} />
            设为最新工具
          </label>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="mb-2 text-sm text-white">发布状态</div>
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value === "hidden" ? "hidden" : "published")
              }
              className="h-10 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-white/30"
            >
              <option value="published" className="text-black">
                published
              </option>
              <option value="hidden" className="text-black">
                hidden
              </option>
            </select>
          </div>
        </div>

        {errorMessage ? (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {successMessage}
          </div>
        ) : null}

        <Button
          type="button"
          className="h-12 w-full bg-white text-black hover:bg-white/90"
          disabled={isPending}
          onClick={handleSubmit}
        >
          {isPending ? "提交中..." : "提交工具"}
        </Button>
      </div>
    </section>
  );
}
