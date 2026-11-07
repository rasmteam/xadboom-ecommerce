import { PieceForm } from "@/components/admin/piece-form";
import { api } from "@/lib/api";

export default async function NewPiecePage() {
  const options = await api.adminOptions();
  return <PieceForm options={options} />;
}
