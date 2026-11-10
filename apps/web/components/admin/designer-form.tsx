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
  { name: "bio", label: "Short bio (cards and search results)", type: "textarea" },
  { name: "portrait", label: "Designers page portrait (4:3)", type: "image" },
  { name: "profileImage", label: "Home page profile image (3:4)", type: "image" },
  { name: "tagline", label: "Profile tagline", type: "text", wide: true, hint: 'One line under the name, e.g. "Pioneering Kinetic Tectonics & Spatial Mutability"' },
  { name: "practice", label: "Practice locations", type: "text", wide: true, hint: 'e.g. "London · Tehran · Harvard GSD"' },
  { name: "landmarkWorks", label: "Landmark works", type: "textarea", hint: 'One per line: Title | Place, Year  (e.g. Sharifi-ha House (Kinetic Facades) | Tehran, 2014)' },
  { name: "statement", label: "Curatorial statement (quote)", type: "textarea" },
  { name: "monographTitle", label: "Biography headline", type: "text", wide: true, hint: "Large headline of the monograph section" },
  { name: "biography", label: "Full biography", type: "textarea", hint: "Separate paragraphs with a blank line" },
  { name: "monographImage", label: "Biography wide image (16:9)", type: "image" },
  { name: "monographCaption", label: "Biography image caption", type: "text", wide: true },
  { name: "milestones", label: "Institutional milestones", type: "textarea", hint: "One per line: Institution | Role | Place" },
  { name: "runNote", label: "Edition run note", type: "text", wide: true, hint: 'e.g. "Strictly limited to 6 units per fabrication casting worldwide"' },
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
    tagline: designer?.tagline ?? "",
    practice: designer?.practice ?? "",
    landmarkWorks: designer?.landmarkWorks ?? "",
    statement: designer?.statement ?? "",
    monographTitle: designer?.monographTitle ?? "",
    biography: designer?.biography ?? "",
    monographImage: designer?.monographImage ?? null,
    monographCaption: designer?.monographCaption ?? "",
    milestones: designer?.milestones ?? "",
    runNote: designer?.runNote ?? "",
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
