import { EntityForm } from "@/components/admin/entity-form";
import { AdminPage } from "@/components/admin/ui";

export default function NewUserPage() {
  return (
    <AdminPage crumb="Users & Collector Accounts" title="Register Account" subtitle="Creates an account with a one-time temporary password that you pass on securely. They should change it after signing in.">
      <EntityForm
        fields={[
          { name: "name", label: "Full name", type: "text", required: true },
          { name: "email", label: "Email", type: "text", required: true },
          {
            name: "role",
            label: "Role",
            type: "select",
            options: [
              { value: "COLLECTOR", label: "Collector" },
              { value: "EDITOR", label: "Curator / Editor (admin access)" },
              { value: "ADMIN", label: "Administrator (full access)" },
            ],
          },
          { name: "tier", label: "Account tier", type: "text", hint: 'e.g. "Private Collector (VIP)"' },
          { name: "regionHub", label: "Regional hub", type: "text" },
        ]}
        initial={{ name: "", email: "", role: "COLLECTOR", tier: "", regionHub: "" }}
        submitUrl="/api/admin/users"
        method="POST"
        backHref="/admin/users"
        submitLabel="Create account"
        successMessage={"Account created for {email}.\n\nTemporary password (shown once): {temporaryPassword}"}
      />
    </AdminPage>
  );
}
