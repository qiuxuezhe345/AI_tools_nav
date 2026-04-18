import { ToolForm } from "@/components/admin/tool-form";
import { getToolCategories } from "@/lib/admin-tools";

export default async function NewToolPage() {
  const categories = await getToolCategories();

  return <ToolForm categories={categories} mode="create" />;
}
