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
  designer: { slug: string; name: string; title: string | null; studio: string | null; portrait: string | null };
  description: string | null;
  editorial: { title: string | null; paragraphs: string[]; quote: string | null; quoteBy: string | null } | null;
  viewer: { url: string; filename: string; sizeBytes: number } | null;
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
  profileImage: string | null;
  pieceCount: number;
  featuredPiece: { title: string; slug: string } | null;
  filterKey: "tectonics" | "avantgarde" | "materials";
};

export type SessionUser = { id: string; email: string; name: string; role: "ADMIN" | "EDITOR" | "COLLECTOR" };

export type PriceSettings = { currencyMode: "USD" | "TOMAN" | "BOTH"; usdToToman: number | null };

export type AdminPieceRow = {
  id: string;
  slug: string;
  sku: string;
  title: string;
  categoryName: string;
  image: string;
  designerName: string;
  designerMeta: string;
  edition: string;
  availableCount: number;
  price: string;
  state: "available" | "low" | "soldout" | "draft" | "archived";
  has3d: boolean;
};

export type AdminPieces = {
  rows: AdminPieceRow[];
  total: number;
  page: number;
  pages: number;
  from: number;
  to: number;
  stats: {
    totalPieces: number;
    typologies: number;
    availableUnits: number;
    allocationPercent: number;
    lowStock: number;
    cadReadyPercent: number;
  };
  categories: { slug: string; name: string; count: number }[];
  designers: { slug: string; name: string; studio: string | null }[];
};

export type PieceFormOptions = {
  designers: { id: string; name: string; studio: string | null }[];
  categories: { id: string; name: string }[];
};

export type PieceFormData = {
  id: string;
  slug: string;
  sku: string;
  title: string;
  designerId: string;
  categoryId: string;
  provenance: string | null;
  description: string | null;
  leadTime: string | null;
  storyTitle: string | null;
  story: string | null;
  quote: string | null;
  quoteBy: string | null;
  materials: string[];
  images: { url: string; alt: string | null }[];
  totalEditions: number;
  releasedEditions: number;
  placedEditions: number;
  priceUsd: number;
  lengthMm: number | null;
  widthMm: number | null;
  heightMm: number | null;
  weightKg: number | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  featured: boolean;
};

export type CartItem = {
  reservationId: string;
  slug: string;
  title: string;
  sku: string;
  designerLine: string;
  image: string;
  edition: string;
  price: DisplayPrice;
  priceUsdCents: number;
  expiresAt: string;
  remainingSeconds: number;
};

export type CartData = {
  items: CartItem[];
  count: number;
  lockMinutes: number;
  currencyMode?: "USD" | "TOMAN" | "BOTH";
  provider?: string;
  totals: DisplayPrice | null;
};

export type PublicOrder = {
  number: string;
  status: "PENDING_PAYMENT" | "PAID" | "IN_CRATING" | "DISPATCHED" | "DELIVERED" | "CANCELLED" | "REFUNDED";
  provider: string;
  currency: "USD" | "TOMAN";
  total: string;
  certId: string | null;
  paymentDueAt: string | null;
  collector: { name: string; email: string };
  shipTo: string;
  createdAt: string;
  items: { title: string; sku: string; slug: string; edition: string; image: string; price: string }[];
  crateStatus: string | null;
};
