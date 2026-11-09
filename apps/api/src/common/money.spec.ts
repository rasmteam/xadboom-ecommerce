import { describe, expect, it } from "vitest";
import { displayPrice, tomanFor } from "./money";

const piece = { priceUsdCents: 245000 };

describe("displayPrice", () => {
  it("shows dollars in USD mode", () => {
    expect(displayPrice(piece, { currencyMode: "USD", usdToToman: 60000 })).toEqual({ usd: "$2,450", toman: null, primary: "$2,450" });
  });

  it("converts to Toman with the admin rate", () => {
    const p = displayPrice(piece, { currencyMode: "TOMAN", usdToToman: 60000 });
    expect(p.primary).toBe("147,000,000 Toman");
    expect(p.usd).toBeNull();
  });

  it("shows both, dollars first", () => {
    const p = displayPrice(piece, { currencyMode: "BOTH", usdToToman: 60000 });
    expect(p.primary).toBe("$2,450");
    expect(p.toman).toBe("147,000,000 Toman");
  });

  it("falls back to USD when Toman is requested without a rate", () => {
    expect(displayPrice(piece, { currencyMode: "TOMAN", usdToToman: null }).primary).toBe("$2,450");
  });

  it("uses a fixed Toman price when one is set", () => {
    expect(tomanFor({ priceUsdCents: 100, priceTomanOverride: 5000 }, 60000)).toBe(5000);
  });
});
