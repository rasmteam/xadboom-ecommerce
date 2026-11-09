import type { Metadata } from "next";
import { InfoPage } from "@/components/site/info-page";

export const metadata: Metadata = { title: "Authenticity Guarantee | Xadboom", alternates: { canonical: "/authenticity" } };

export default function Page() {
  return (
    <InfoPage
      title="Authenticity Guarantee"
      intro="Every piece is a numbered edition made with its designer, and comes with a provenance certificate."
      sections={[
        { heading: "Numbered editions", body: "Each piece carries an edition number out of a fixed run. When an edition is sold it is never offered again." },
        { heading: "Provenance certificate", body: "When your order is paid, a certificate is issued with the piece, designer, edition number and date, so ownership can be verified later." },
        { heading: "Designer attribution", body: "Every piece is attributed to the designer or studio that created it, shown on the product page." },
      ]}
    />
  );
}
