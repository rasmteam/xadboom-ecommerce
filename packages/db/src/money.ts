import type { CurrencyMode } from "./generated/client";

export type PriceSettings = { currencyMode: CurrencyMode; usdToToman: number | null };
export type PriceInput = { priceUsdCents: number; priceTomanOverride?: number | null };

export type DisplayPrice = {
  usd: string | null;
  toman: string | null;
  /** primary label for single-price spots (cards, cart) */
  primary: string;
};

const usdFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const tomanFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export function tomanFor(piece: PriceInput, usdToToman: number | null): number | null {
  if (piece.priceTomanOverride) return piece.priceTomanOverride;
  if (!usdToToman) return null;
  return Math.round((piece.priceUsdCents / 100) * usdToToman);
}

/** Resolve what the storefront shows for a piece under the admin's currency setting. */
export function displayPrice(piece: PriceInput, settings: PriceSettings): DisplayPrice {
  const usd = usdFmt.format(piece.priceUsdCents / 100);
  const tomanValue = tomanFor(piece, settings.usdToToman);
  const toman = tomanValue === null ? null : `${tomanFmt.format(tomanValue)} Toman`;

  // TOMAN/BOTH need a rate; without one fall back to USD rather than show nothing
  if (settings.currencyMode === "TOMAN" && toman) return { usd: null, toman, primary: toman };
  if (settings.currencyMode === "BOTH" && toman) return { usd, toman, primary: usd };
  return { usd, toman: null, primary: usd };
}
