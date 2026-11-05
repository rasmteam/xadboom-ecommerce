"use client";

import { useEffect, useState } from "react";

/** Counts a hold down in the browser; the page itself is refreshed from the server on demand. */
export function HoldsClock({ seconds }: { seconds: number }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    setLeft(seconds);
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [seconds]);
  const m = String(Math.floor(left / 60)).padStart(2, "0");
  const s = String(left % 60).padStart(2, "0");
  return (
    <span className={`font-label-caps text-[11px] tracking-wider ${left < 180 ? "text-error font-semibold" : "text-primary"}`}>
      <span className="material-symbols-outlined text-[14px] align-middle mr-1">timelapse</span>
      {m}:{s} remaining
    </span>
  );
}
