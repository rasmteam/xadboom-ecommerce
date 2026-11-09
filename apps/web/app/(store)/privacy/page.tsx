import type { Metadata } from "next";
import { InfoPage } from "@/components/site/info-page";

export const metadata: Metadata = { title: "Privacy Policy | Xadboom", alternates: { canonical: "/privacy" } };

export default function Page() {
  return (
    <InfoPage
      title="Privacy Policy"
      intro="We collect only what we need to take and deliver your order and to answer your inquiries."
      sections={[
        { heading: "What we collect", body: "Your name, email, delivery address and phone number when you check out, register or send an inquiry; and the contents of your inquiry." },
        { heading: "How we use it", body: "To process and deliver orders, send order emails, answer inquiries and keep records the law requires. We do not sell your data." },
        { heading: "Cookies", body: "We use a cookie to keep your bag, and a sign-in cookie if you have an account. We do not use advertising cookies." },
        { heading: "Your rights", body: "You can ask us to correct or delete your data by contacting the atelier." },
      ]}
    />
  );
}
