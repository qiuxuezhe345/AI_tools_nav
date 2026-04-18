import { ToolForm } from "@/components/admin/tool-form";
import { getToolById, getToolCategories } from "@/lib/admin-tools";

export default async function EditToolPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [tool, categories] = await Promise.all([
    getToolById(id),
    getToolCategories(),
  ]);

  return <ToolForm categories={categories} initialTool={tool} mode="edit" />;
}
