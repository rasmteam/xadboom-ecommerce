import { AdminPage } from "@/components/admin/ui";
import { CategoryForm } from "@/components/admin/category-form";

export default function NewCategoryPage() {
  return (
    <AdminPage crumb="Categories & Typologies" title="Add New Category" subtitle="Create a spatial typology that pieces can be filed under.">
      <CategoryForm />
    </AdminPage>
  );
}
