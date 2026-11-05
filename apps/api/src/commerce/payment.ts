// Payment providers behind one interface. `manual` (invoice, admin confirms receipt) works out of the box;
// `zarinpal` talks to the Zarinpal v4 REST API and needs a merchant account (ZARINPAL_MERCHANT_ID).
export type PayableOrder = {
  number: string;
  currency: "USD" | "TOMAN";
  totalAmount: number; // USD cents or Toman
  collectorEmail: string;
  collectorPhone: string | null;
};

export type StartResult = { authority?: string; redirectUrl?: string };
export type VerifyResult = { ok: boolean; refId?: string; raw?: unknown };

export interface PaymentProvider {
  readonly name: string;
  start(order: PayableOrder, callbackUrl: string): Promise<StartResult>;
  verify(authority: string, order: PayableOrder): Promise<VerifyResult>;
}

export class ManualProvider implements PaymentProvider {
  readonly name = "manual";
  async start(): Promise<StartResult> {
    return {}; // no redirect: the atelier sends an invoice and confirms payment in the admin
  }
  async verify(): Promise<VerifyResult> {
    return { ok: false };
  }
}

export class ZarinpalProvider implements PaymentProvider {
  readonly name = "zarinpal";
  private get base() {
    return process.env.ZARINPAL_SANDBOX === "true" ? "https://sandbox.zarinpal.com" : "https://payment.zarinpal.com";
  }
  private get merchant() {
    const id = process.env.ZARINPAL_MERCHANT_ID;
    if (!id) throw new Error("ZARINPAL_MERCHANT_ID is not set");
    return id;
  }

  private assertToman(order: PayableOrder) {
    // the gateway settles in IRR/IRT only
    if (order.currency !== "TOMAN") throw new Error("Zarinpal can only charge Toman orders");
  }

  async start(order: PayableOrder, callbackUrl: string): Promise<StartResult> {
    this.assertToman(order);
    const res = await fetch(`${this.base}/pg/v4/payment/request.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        merchant_id: this.merchant,
        amount: order.totalAmount,
        currency: "IRT",
        callback_url: callbackUrl,
        description: `Xadboom order ${order.number}`,
        metadata: { email: order.collectorEmail, ...(order.collectorPhone ? { mobile: order.collectorPhone } : {}) },
      }),
    });
    const json = (await res.json()) as { data?: { code?: number; authority?: string }; errors?: unknown };
    if (json.data?.code !== 100 || !json.data.authority) throw new Error(`Gateway refused the request: ${JSON.stringify(json.errors ?? json.data)}`);
    return { authority: json.data.authority, redirectUrl: `${this.base}/pg/StartPay/${json.data.authority}` };
  }

  async verify(authority: string, order: PayableOrder): Promise<VerifyResult> {
    this.assertToman(order);
    const res = await fetch(`${this.base}/pg/v4/payment/verify.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ merchant_id: this.merchant, amount: order.totalAmount, authority }),
    });
    const json = (await res.json()) as { data?: { code?: number; ref_id?: number | string } };
    // 100 = verified now, 101 = already verified earlier
    const ok = json.data?.code === 100 || json.data?.code === 101;
    return { ok, refId: json.data?.ref_id !== undefined ? String(json.data.ref_id) : undefined, raw: json };
  }
}

export function getPaymentProvider(): PaymentProvider {
  return process.env.PAYMENT_PROVIDER === "zarinpal" ? new ZarinpalProvider() : new ManualProvider();
}
