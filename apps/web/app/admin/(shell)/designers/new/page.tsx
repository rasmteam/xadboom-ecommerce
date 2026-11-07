import { AdminPage } from "@/components/admin/ui";
import { DesignerForm } from "@/components/admin/designer-form";

export default function NewDesignerPage() {
  return (
    <AdminPage crumb="Designers & Collaborators" title="Add Collaborator" subtitle="Register an architect, designer or atelier whose work Xadboom publishes.">
      <DesignerForm />
    </AdminPage>
  );
}
