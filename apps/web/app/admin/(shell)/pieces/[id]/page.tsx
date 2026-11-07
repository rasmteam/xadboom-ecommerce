import { PieceForm } from "@/components/admin/piece-form";
import { api } from "@/lib/api";

export default async function EditPiecePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [options, piece] = await Promise.all([api.adminOptions(), api.adminPiece(id)]);
  return <PieceForm key={piece.id} options={options} initial={piece} />;
}
