import { EntityForm, type Field } from "./entity-form";
import type { AdminCategory } from "@/lib/admin-types";

const FIELDS: Field[] = [
  { name: "name", label: "Typology name", type: "text", required: true },
  { name: "sortOrder", label: "Display order", type: "number" },
  { name: "description", label: "Description", type: "textarea" },
];

export function CategoryForm({ category }: { category?: AdminCategory }) {
  return (
    <EntityForm
      fields={FIELDS}
      initial={{ name: category?.name ?? "", sortOrder: category?.sortOrder ?? 0, description: category?.description ?? "" }}
      submitUrl={category ? `/api/admin/categories/${category.id}` : "/api/admin/categories"}
      method={category ? "PATCH" : "POST"}
      backHref="/admin/categories"
      submitLabel={category ? "Save typology" : "Add typology"}
      deleteUrl={category ? `/api/admin/categories/${category.id}` : undefined}
    />
  );
}
