"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminCategory } from "@/lib/admin-categories";
import { cn } from "@/lib/utils";
import { Pencil, Search, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

type Props = {
  categories: AdminCategory[];
};

type FormState = {
  slug: string;
  name: string;
  icon: string;
  sort_order: string;
  is_active: boolean;
};

const emptyForm: FormState = {
  slug: "",
  name: "",
  icon: "",
  sort_order: "0",
  is_active: true,
};

function isImageUrl(value: string | null) {
  if (!value) {
    return false;
  }

  return /^(https?:)?\/\//i.test(value.trim());
}

function normalizeImageUrl(value: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  return trimmed;
}

function getCategoryIconFallback(category: AdminCategory) {
  const icon = category.icon?.trim();

  if (icon && !isImageUrl(icon)) {
    return icon.slice(0, 2).toUpperCase();
  }

  return category.name.trim().slice(0, 1).toUpperCase() || "#";
}

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function CategoryIconPreview({ category }: { category: AdminCategory }) {
  const [hasError, setHasError] = useState(false);
  const imageUrl = normalizeImageUrl(category.icon);
  const shouldRenderImage = Boolean(imageUrl) && isImageUrl(imageUrl) && !hasError;

  return (
    <div className="flex h-10 w-10 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
      {shouldRenderImage ? (
        <img
          src={imageUrl ?? ""}
          alt={`${category.name} 图标`}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm font-medium text-white/70">
          {getCategoryIconFallback(category)}
        </div>
      )}
    </div>
  );
}

export function CategoriesManagementPanel({ categories }: Props) {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredCategories = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();

    if (!normalized) {
      return categories;
    }

    return categories.filter((category) => {
      return (
        category.name.toLowerCase().includes(normalized) ||
        category.slug.toLowerCase().includes(normalized)
      );
    });
  }, [categories, keyword]);

  function resetForm() {
    setEditingCategoryId(null);
    setForm(emptyForm);
  }

  function fillForm(category: AdminCategory) {
    setEditingCategoryId(category.id);
    setForm({
      slug: category.slug,
      name: category.name,
      icon: category.icon ?? "",
      sort_order: String(category.sort_order),
      is_active: category.is_active,
    });
  }

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch(
        editingCategoryId
          ? `/api/admin/categories/${editingCategoryId}`
          : "/api/admin/categories",
        {
          method: editingCategoryId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            slug: form.slug,
            name: form.name,
            icon: form.icon || null,
            sort_order: Number(form.sort_order),
            is_active: form.is_active,
          }),
        },
      );

      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(result.message ?? "提交失败");
      }

      setMessage(result.message ?? (editingCategoryId ? "分类更新成功" : "分类创建成功"));
      resetForm();
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "提交失败，请稍后重试",
      );
    }
  }

  async function deleteCategory(categoryId: number) {
    const shouldDelete = window.confirm(
      "删除后将无法恢复。只有未被工具或提交使用的分类才能删除，确定继续吗？",
    );

    if (!shouldDelete) {
      return;
    }

    setMessage(null);
    setErrorMessage(null);
    setPendingDeleteId(categoryId);

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: "DELETE",
      });

      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(result.message ?? "删除失败");
      }

      if (editingCategoryId === categoryId) {
        resetForm();
      }

      setMessage(result.message ?? "分类删除成功");
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "删除失败，请稍后重试",
      );
    } finally {
      setPendingDeleteId(null);
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">工具分类管理</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
            这里用于维护 `tool_categories` 表。你可以新增分类、修改名称与排序、停用分类，
            以及在分类未被使用时安全删除。
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="text-xs text-white/50">分类总数</div>
            <div className="mt-1 text-lg font-semibold text-white">
              {categories.length}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="text-xs text-white/50">启用中的分类</div>
            <div className="mt-1 text-lg font-semibold text-white">
              {categories.filter((item) => item.is_active).length}
            </div>
          </div>
        </div>
      </div>

      {message ? (
        <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <form
          onSubmit={submitForm}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-white">
                {editingCategoryId ? "编辑分类" : "新增分类"}
              </h3>
              <p className="mt-1 text-sm text-white/50">
                slug 将用于程序内标识，建议保持简短稳定。
              </p>
            </div>
            {editingCategoryId ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={resetForm}
                className="h-9 w-9 rounded-full border-white/15 bg-transparent text-white hover:bg-white hover:text-black"
              >
                <X className="h-4 w-4" />
              </Button>
            ) : null}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-name" className="text-white">
                分类名称
              </Label>
              <Input
                id="category-name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="例如：AI 写作"
                className="border-white/10 bg-black text-white placeholder:text-white/35"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-slug" className="text-white">
                分类标识
              </Label>
              <Input
                id="category-slug"
                value={form.slug}
                onChange={(event) =>
                  setForm((current) => ({ ...current, slug: event.target.value }))
                }
                placeholder="例如：ai-writing"
                className="border-white/10 bg-black text-white placeholder:text-white/35"
              />
              <p className="text-xs leading-5 text-white/45">
                只允许小写字母、数字和连字符。
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-icon" className="text-white">
                图标地址或简写
              </Label>
              <Input
                id="category-icon"
                value={form.icon}
                onChange={(event) =>
                  setForm((current) => ({ ...current, icon: event.target.value }))
                }
                placeholder="例如：https://... 或 AI"
                className="border-white/10 bg-black text-white placeholder:text-white/35"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-sort-order" className="text-white">
                排序值
              </Label>
              <Input
                id="category-sort-order"
                type="number"
                value={form.sort_order}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    sort_order: event.target.value,
                  }))
                }
                className="border-white/10 bg-black text-white placeholder:text-white/35"
              />
            </div>

            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-3 py-3">
              <Checkbox
                checked={form.is_active}
                onCheckedChange={(checked) =>
                  setForm((current) => ({
                    ...current,
                    is_active: checked === true,
                  }))
                }
                className="border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-black"
              />
              <div>
                <div className="text-sm font-medium text-white">启用分类</div>
                <div className="text-xs text-white/45">
                  停用后不会出现在新增工具的分类下拉中。
                </div>
              </div>
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              type="submit"
              disabled={isPending}
              className="bg-white text-black hover:bg-white/90"
            >
              {editingCategoryId ? "保存分类" : "创建分类"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={resetForm}
              className="border-white/15 bg-transparent text-white hover:bg-white hover:text-black"
            >
              重置表单
            </Button>
          </div>
        </form>

        <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">分类列表</h3>
              <p className="mt-1 text-sm text-white/50">
                支持搜索、编辑和删除。已被引用的分类不可删除。
              </p>
            </div>
            <div className="relative w-full md:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <Input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="搜索分类名称或 slug"
                className="border-white/10 bg-black pl-9 text-white placeholder:text-white/35"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[860px] border-collapse text-left text-sm">
              <thead className="bg-white/[0.03] text-white/55">
                <tr>
                  <th className="px-4 py-3 font-medium">分类</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">排序</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">状态</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">工具数</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">提交数</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">更新时间</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((category) => {
                  const isDeleting = pendingDeleteId === category.id;
                  const isEditing = editingCategoryId === category.id;

                  return (
                    <tr key={category.id} className="border-t border-white/10">
                      <td className="min-w-[260px] px-4 py-3">
                        <div className="flex items-start gap-3">
                          <CategoryIconPreview category={category} />
                          <div className="min-w-0">
                            <div className="break-words font-medium text-white">
                              {category.name}
                            </div>
                            <div className="mt-1 break-all text-xs text-white/45">
                              slug: {category.slug}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-white/60">
                        {category.sort_order}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-medium",
                            category.is_active
                              ? "bg-emerald-500/15 text-emerald-200"
                              : "bg-white/10 text-white/60",
                          )}
                        >
                          {category.is_active ? "启用中" : "已停用"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-white/60">
                        {category.tools_count}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-white/60">
                        {category.submissions_count}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-white/60">
                        {formatDate(category.updated_at)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => fillForm(category)}
                            className={cn(
                              "h-9 w-9 rounded-full border-white/15 bg-transparent text-white hover:bg-white hover:text-black",
                              isEditing ? "border-white bg-white text-black" : "",
                            )}
                            title="编辑分类"
                            aria-label="编辑分类"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            disabled={isDeleting}
                            onClick={() => deleteCategory(category.id)}
                            className="h-9 w-9 rounded-full border-rose-500/35 bg-transparent text-rose-200 hover:bg-rose-500 hover:text-white"
                            title="删除分类"
                            aria-label="删除分类"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredCategories.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-white/15 px-5 py-10 text-center text-sm text-white/55">
              没有匹配到分类，请调整搜索关键词。
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
