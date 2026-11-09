// Shapes returned by the admin endpoints (apps/api/src/admin/ops.module.ts).
export type OrderStatus = "PENDING_PAYMENT" | "PAID" | "IN_CRATING" | "DISPATCHED" | "DELIVERED" | "CANCELLED" | "REFUNDED";

export type AdminOrders = {
  rows: {
    id: string;
    number: string;
    createdAt: string;
    status: OrderStatus;
    collectorName: string;
    collectorEmail: string;
    destination: string;
    token: string;
    guest: boolean;
    events: { at: string; label: string }[];
    items: { title: string; sku: string; edition: string; image: string; designer: string; materials: string | null }[];
    total: string;
    carrier: string | null;
    crateStatus: string | null;
    trackingRef: string | null;
    provider: string | null;
  }[];
  total: number;
  page: number;
  pages: number;
  counts: { all: number; pending: number; paid: number; crating: number; dispatched: number; delivered: number; cancelled: number };
  volume: { usd: string; toman: string };
  carriers: string[];
};

export type InquiryStatus = "NEW" | "ACTIVE_REVIEW" | "TRIAGE_PASSED" | "CONFIRMED" | "CLOSED";
export type AdminInquiries = {
  rows: {
    id: string;
    number: string;
    client: string;
    email: string;
    project: string | null;
    type: string;
    piece: { title: string; slug: string; designer: string } | null;
    message: string;
    status: InquiryStatus;
    notes: string | null;
    assignee: { id: string; name: string } | null;
    createdAt: string;
    slaMinutes: number | null;
  }[];
  total: number;
  page: number;
  pages: number;
  stats: { total: number; open: number; unassigned: number; byStatus: Record<string, number> };
  types: { type: string; count: number }[];
  staff: { id: string; name: string }[];
};

export type AdminDesigner = {
  id: string;
  slug: string;
  name: string;
  studio: string | null;
  city: string | null;
  title: string | null;
  discipline: string | null;
  materiality: string | null;
  sortName: string | null;
  bio: string | null;
  portrait: string | null;
  profileImage: string | null;
  published: boolean;
  sortOrder: number;
  pieceCount: number;
  pieces: { title: string; edition: string }[];
};

export type AdminCategory = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
  pieceCount: number;
  titles: string[];
  unitsTotal: number;
  available: number;
  allocated: number;
  lowStock: number;
  withDimensions: number;
};

export type AdminUsers = {
  rows: {
    id: string;
    name: string;
    email: string;
    studio: string | null;
    role: "ADMIN" | "EDITOR" | "COLLECTOR";
    tier: string | null;
    kycStatus: "UNVERIFIED" | "PENDING" | "VERIFIED";
    regionHub: string | null;
    lastActiveAt: string | null;
    createdAt: string;
    orders: number;
    pieces: number;
    volumeUsd: string;
    volumeToman: string | null;
  }[];
  total: number;
  page: number;
  pages: number;
  stats: { total: number; staff: number; collectors: number; verified: number; pending: number };
  hubs: string[];
};

export type AdminOverview = {
  pieces: number;
  units: { available: number; reserved: number; sold: number; withheld: number };
  activeHolds: number;
  pendingOrders: number;
  openInquiries: number;
  slaRisk: number;
  revenue: { usd: string; toman: string; orders: number };
  recentOrders: { id: string; number: string; status: OrderStatus; collectorName: string; total: string; createdAt: string }[];
  recentInquiries: { id: string; number: string; client: string; type: string; status: InquiryStatus; createdAt: string }[];
};

export type ShellCounts = { pieces: number; designers: number; ordersOpen: number; users: number; inquiriesOpen: number };
