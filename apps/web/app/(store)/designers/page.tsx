import type { Metadata } from "next";
import { DesignersPage } from "@/components/legacy/designers1";
import { api } from "@/lib/api";

export const metadata: Metadata = {
  title: "The Architects & Visionaries — Xadboom",
  description:
    "Collaborating architects and industrial designers authoring strictly limited physical furniture assets.",
};

export default async function Page() {
  const designers = await api.designers();
  return <DesignersPage designers={designers} />;
}
