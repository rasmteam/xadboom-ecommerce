import type { Metadata } from "next";
import { InfoPage } from "@/components/site/info-page";

export const metadata: Metadata = { title: "Terms of Acquisition | Xadboom", alternates: { canonical: "/terms" } };

export default function Page() {
  return (
    <InfoPage
      title="Terms of Acquisition"
      intro="These terms describe how limited-edition pieces are reserved, paid for and delivered."
      sections={[
        { heading: "Reservations", body: "Adding a piece to your bag holds one edition for 15 minutes. If checkout is not completed in that time the edition is released to other collectors. A maximum of three pieces can be held at once." },
        { heading: "Orders and payment", body: "After checkout you receive an order number. Payment is completed by the method shown on your order page; manual invoices are held for 48 hours. Prices are shown in USD and may be displayed in Toman at the rate set by the atelier on the day of the order." },
        { heading: "Delivery", body: "Pieces are made in limited editions and delivered crated. Lead times are shown on each product page and confirmed by the atelier after payment." },
        { heading: "Cancellations", body: "Unpaid orders can be cancelled at any time and the edition is returned to the collection. After payment, contact the atelier to discuss changes or cancellation." },
      ]}
    />
  );
}
