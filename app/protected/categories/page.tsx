import { CategoriesManagementPanel } from "@/components/admin/categories-management-panel";
import { getCategories } from "@/lib/admin-categories";

export default async function CategoriesPage() {
  const categories = await getCategories();

  return <CategoriesManagementPanel categories={categories} />;
}
