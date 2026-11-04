"use client";

import { useEffect } from "react";

const ACTIVE_ADD = ["border-2", "border-obsidian", "bg-white"];
const IDLE_ADD = ["border", "border-[#e8d6d0]", "bg-[#fff1ec]"];

/** Gallery behaviour: clicking a thumbnail swaps the main plate image and its labels. */
export function ProductInteractions() {
  useEffect(() => {
    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>(".thumb-btn"));
    const primary = document.getElementById("primaryViewer") as HTMLImageElement | null;
    const plateLabel = document.getElementById("plateLabel");
    const plateSubtitle = document.getElementById("plateSubtitle");
    if (!primary || buttons.length === 0) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const handlers = buttons.map((btn, index) => {
      const onClick = () => {
        primary.style.opacity = "0.3";
        clearTimeout(timer);
        timer = setTimeout(() => {
          primary.src = btn.dataset.src ?? primary.src;
          primary.alt = btn.dataset.alt ?? primary.alt;
          if (plateLabel && btn.dataset.plate) plateLabel.textContent = btn.dataset.plate;
          if (plateSubtitle && btn.dataset.sub) plateSubtitle.textContent = btn.dataset.sub;
          primary.style.opacity = "1";
        }, 120);
        buttons.forEach((b, i) => {
          const on = i === index;
          b.classList.remove(...(on ? IDLE_ADD : ACTIVE_ADD));
          b.classList.add(...(on ? ACTIVE_ADD : IDLE_ADD));
        });
      };
      btn.addEventListener("click", onClick);
      return () => btn.removeEventListener("click", onClick);
    });

    return () => {
      clearTimeout(timer);
      handlers.forEach((off) => off());
    };
  }, []);

  return null;
}
