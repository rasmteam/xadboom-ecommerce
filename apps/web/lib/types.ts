// Shapes returned by the Xadboom API (apps/api). Display strings (prices, labels) are already resolved server-side.

export type DisplayPrice = { usd: string | null; toman: string | null; primary: string };

export type PieceCard = {
  id: string;
  sku: string;
  slug: string;
  title: string;
  designerName: string;
  designerLine: string;
  studio: string | null;
  materials: string | null;
  categorySlug: string;
  categoryName: string;
  tag: string;
  image: string;
  total: number;
  available: number;
  nextEdition: number | null;
  editionLabel: string;
  availabilityLabel: string;
  stockLabel: string;
  lowStock: boolean;
  soldOut: boolean;
  price: DisplayPrice;
  priceUnit: string;
};

export type CatalogData = {
  cards: PieceCard[];
  total: number;
  page: number;
  pages: number;
  allCount: number;
  availableEditions: number;
  categories: { slug: string; name: string; count: number }[];
};

export type FeaturedData = { cards: PieceCard[]; total: number };

export type PieceDetail = {
  card: PieceCard;
  description: string | null;
  leadTime: string | null;
  provenance: string | null;
  martindale: string | null;
  dimensions: { lengthMm: number | null; widthMm: number | null; heightMm: number | null; weightKg: number | null };
  images: { url: string; alt: string | null }[];
  assets: { id: string; kind: string; filename: string; url: string; isViewerModel: boolean }[];
};

export type DesignerRow = {
  id: string;
  slug: string;
  name: string;
  sortName: string | null;
  studio: string | null;
  city: string | null;
  title: string | null;
  discipline: string | null;
  materiality: string | null;
  bio: string | null;
  portrait: string | null;
  pieceCount: number;
  filterKey: "tectonics" | "avantgarde" | "materials";
};

export type SessionUser = { id: string; email: string; name: string; role: "ADMIN" | "EDITOR" | "COLLECTOR" };
