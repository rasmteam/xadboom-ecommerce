import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ManualProvider, ZarinpalProvider, getPaymentProvider, type PayableOrder } from "./payment";

const toman: PayableOrder = { number: "XB-DISPATCH-000001", currency: "TOMAN", totalAmount: 147_000_000, collectorEmail: "a@b.co", collectorPhone: "09120000000" };
const usd: PayableOrder = { ...toman, currency: "USD", totalAmount: 245000 };

describe("payment provider selection", () => {
  afterEach(() => {
    delete process.env.PAYMENT_PROVIDER;
  });
  it("defaults to manual invoicing", () => {
    expect(getPaymentProvider().name).toBe("manual");
  });
  it("switches to zarinpal by env", () => {
    process.env.PAYMENT_PROVIDER = "zarinpal";
    expect(getPaymentProvider().name).toBe("zarinpal");
  });
  it("manual never redirects", async () => {
    expect(await new ManualProvider().start()).toEqual({});
  });
});

describe("ZarinpalProvider (mocked gateway)", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    process.env.ZARINPAL_MERCHANT_ID = "00000000-0000-0000-0000-000000000000";
    process.env.ZARINPAL_SANDBOX = "true";
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    delete process.env.ZARINPAL_MERCHANT_ID;
    delete process.env.ZARINPAL_SANDBOX;
  });

  it("requests a payment in Toman and builds the redirect", async () => {
    fetchMock.mockResolvedValueOnce({ json: async () => ({ data: { code: 100, authority: "A0000001" } }) });
    const r = await new ZarinpalProvider().start(toman, "https://shop.test/api/payments/zarinpal/callback?n=1");
    expect(r).toEqual({ authority: "A0000001", redirectUrl: "https://sandbox.zarinpal.com/pg/StartPay/A0000001" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://sandbox.zarinpal.com/pg/v4/payment/request.json");
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({ amount: 147_000_000, currency: "IRT", callback_url: "https://shop.test/api/payments/zarinpal/callback?n=1" });
  });

  it("refuses to charge USD orders", async () => {
    await expect(new ZarinpalProvider().start(usd, "x")).rejects.toThrow(/Toman/);
  });

  it("surfaces a gateway refusal", async () => {
    fetchMock.mockResolvedValueOnce({ json: async () => ({ data: { code: -9 }, errors: { code: -9 } }) });
    await expect(new ZarinpalProvider().start(toman, "x")).rejects.toThrow(/refused/);
  });

  it("verifies payments (100 = ok, 101 = already verified, anything else = failed)", async () => {
    const verify = (code: number) => {
      fetchMock.mockResolvedValueOnce({ json: async () => ({ data: { code, ref_id: 987654 } }) });
      return new ZarinpalProvider().verify("A0000001", toman);
    };
    expect(await verify(100)).toMatchObject({ ok: true, refId: "987654" });
    expect(await verify(101)).toMatchObject({ ok: true });
    expect(await verify(-50)).toMatchObject({ ok: false });
  });

  it("verifies against the same amount that was requested", async () => {
    fetchMock.mockResolvedValueOnce({ json: async () => ({ data: { code: 100, ref_id: 1 } }) });
    await new ZarinpalProvider().verify("A0000001", toman);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ amount: 147_000_000, authority: "A0000001" });
  });

  it("needs a merchant id", async () => {
    delete process.env.ZARINPAL_MERCHANT_ID;
    await expect(new ZarinpalProvider().start(toman, "x")).rejects.toThrow(/MERCHANT/);
  });
});
