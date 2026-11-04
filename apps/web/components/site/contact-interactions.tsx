"use client";

import { useEffect } from "react";

// Real piece slugs for the static options in the form's select; anything else is sent as free text.
const PIECE_SLUGS: Record<string, string> = {
  "lumen-void": "lumen-void-lounge-chair",
  "tectonic-console": "tectonic-monolith-console",
};

const TYPES: Record<string, string> = {
  acquisition: "Acquisition",
  spec: "Trade & Spec",
  appointment: "Private Viewing Request",
  collaboration: "Curatorial Consultation",
};

const ACTIVE = ["bg-primary", "text-on-primary"];
const IDLE = ["bg-surface-container", "text-on-surface"];

/**
 * Behaviour for the (statically rendered) contact page: world clocks, inquiry-type pills,
 * and submitting the form to the API. Attaches to the existing markup by id/class.
 */
export function ContactInteractions() {
  useEffect(() => {
    const cleanups: (() => void)[] = [];

    // --- world clocks ---
    const fmt = (tz: string) =>
      new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz }).format(new Date());
    const tick = () => {
      for (const [id, tz] of [["time-zrh", "Europe/Zurich"], ["time-thr", "Asia/Tehran"], ["time-nyc", "America/New_York"]]) {
        const el = document.getElementById(id);
        if (el) el.textContent = fmt(tz);
      }
    };
    tick();
    const timer = setInterval(tick, 30_000);
    cleanups.push(() => clearInterval(timer));

    // --- inquiry typology pills ---
    let selectedType = "acquisition";
    const pills = Array.from(document.querySelectorAll<HTMLButtonElement>(".typology-pill"));
    pills.forEach((pill) => {
      const onClick = () => {
        selectedType = pill.dataset.type ?? selectedType;
        pills.forEach((p) => {
          p.classList.remove(...ACTIVE);
          p.classList.add(...IDLE);
        });
        pill.classList.remove(...IDLE);
        pill.classList.add(...ACTIVE);
      };
      pill.addEventListener("click", onClick);
      cleanups.push(() => pill.removeEventListener("click", onClick));
    });

    // --- form submit -> API ---
    const form = document.getElementById("client-name")?.closest("form");
    const banner = document.getElementById("confirmation-banner");
    const bannerText = banner?.querySelector("span:last-child");
    if (form) {
      const onSubmit = async (e: Event) => {
        e.preventDefault();
        const val = (id: string) => (document.getElementById(id) as HTMLInputElement | null)?.value.trim() ?? "";
        const select = document.getElementById("piece-interest") as HTMLSelectElement | null;
        const interest = select?.value ?? "";
        const interestLabel = interest ? select?.selectedOptions[0]?.textContent?.trim() : undefined;
        const extra = [
          val("client-phone") && `Phone: ${val("client-phone")}`,
          val("client-territory") && `Base: ${val("client-territory")}`,
          interestLabel && !PIECE_SLUGS[interest] && `Interest: ${interestLabel}`,
        ].filter(Boolean);
        const message = [val("inquiry-scope") || "Inquiry from the contact page.", ...extra].join("\n");
        const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
        if (submit) submit.disabled = true;
        try {
          const res = await fetch("/api/inquiries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: TYPES[selectedType],
              client: val("client-name"),
              email: val("client-email"),
              message,
              pieceSlug: PIECE_SLUGS[interest],
            }),
          });
          if (!banner || !bannerText) return;
          if (res.ok) {
            const { number } = await res.json();
            bannerText.textContent = `Dispatch ${number} logged into atelier registry. A curator will respond within 3 hours.`;
            form.reset();
          } else {
            bannerText.textContent =
              res.status === 429 ? "Too many dispatches from this address. Please try again later." : "We could not send your dispatch. Please check the form and try again.";
          }
          banner.classList.remove("hidden");
          banner.scrollIntoView({ behavior: "smooth", block: "nearest" });
        } finally {
          if (submit) submit.disabled = false;
        }
      };
      form.addEventListener("submit", onSubmit);
      cleanups.push(() => form.removeEventListener("submit", onSubmit));
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
