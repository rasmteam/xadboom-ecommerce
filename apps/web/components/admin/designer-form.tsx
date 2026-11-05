import { EntityForm, type Field } from "./entity-form";
import type { AdminDesigner } from "@/lib/admin-types";

const FIELDS: Field[] = [
  { name: "name", label: "Name (person or duo)", type: "text", required: true },
  { name: "studio", label: "Studio / Atelier", type: "text" },
  { name: "sortName", label: "Directory sort name", type: "text", hint: 'e.g. "Taghaboni, Alireza". Leave empty for duos listed by studio.' },
  { name: "city", label: "Base", type: "text", hint: 'e.g. "Milan / Tehran"' },
  { name: "title", label: "Title", type: "text", hint: 'e.g. "Principal Architect"' },
  { name: "discipline", label: "Discipline", type: "text", hint: "Structural Tectonics, Avant-Garde Spatial, Material Exploration…" },
  { name: "materiality", label: "Primary materiality", type: "text", wide: true },
  { name: "bio", label: "Biography", type: "textarea" },
  { name: "portrait", label: "Designers page portrait (4:3)", type: "image" },
  { name: "profileImage", label: "Home page profile image (3:4)", type: "image" },
  { name: "sortOrder", label: "Display order", type: "number" },
  { name: "published", label: "Visible on the storefront", type: "checkbox" },
];

export function DesignerForm({ designer }: { designer?: AdminDesigner }) {
  const initial = {
    name: designer?.name ?? "",
    studio: designer?.studio ?? "",
    sortName: designer?.sortName ?? "",
    city: designer?.city ?? "",
    title: designer?.title ?? "",
    discipline: designer?.discipline ?? "",
    materiality: designer?.materiality ?? "",
    bio: designer?.bio ?? "",
    portrait: designer?.portrait ?? null,
    profileImage: designer?.profileImage ?? null,
    sortOrder: designer?.sortOrder ?? 0,
    published: designer?.published ?? true,
  };
  return (
    <EntityForm
      fields={FIELDS}
      initial={initial}
      submitUrl={designer ? `/api/admin/designers/${designer.id}` : "/api/admin/designers"}
      method={designer ? "PATCH" : "POST"}
      backHref="/admin/designers"
      submitLabel={designer ? "Save collaborator" : "Add collaborator"}
      deleteUrl={designer ? `/api/admin/designers/${designer.id}` : undefined}
    />
  );
}
