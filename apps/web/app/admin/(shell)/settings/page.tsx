import { redirect } from "next/navigation";
import { CurrencySettings } from "@/components/admin/currency-settings";
import { api } from "@/lib/api";

export default async function SettingsPage() {
  const [user, settings] = await Promise.all([api.me(), api.adminSettings()]);
  if (!user) redirect("/login");

  return (
    <main className="theme-adminPieces relative w-full px-gutter min-h-screen pb-12 bg-[#F7E9E3]">
      <div className="flex flex-col gap-1 py-space-lg">
        <div className="flex items-center gap-2 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px]">
          <span>Curatorial Atelier</span>
          <span className="text-tertiary-fixed-dim">/</span>
          <span className="text-primary font-semibold">Settings</span>
        </div>
        <h1 className="font-headline-md text-headline-md text-primary tracking-tight font-medium mt-1">Settings</h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
          Storefront currency. Prices are stored in USD; Toman is calculated from the rate you set here.
        </p>
      </div>
      <CurrencySettings initial={settings} canEdit={user.role === "ADMIN"} />
    </main>
  );
}
