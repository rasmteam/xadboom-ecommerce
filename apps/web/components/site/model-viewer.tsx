"use client";

import { createElement, useEffect } from "react";

/** Interactive 3D viewer (GLB/glTF) using the self-hosted <model-viewer> web component. */
export function ProductModelViewer({ src, alt }: { src: string; alt: string }) {
  useEffect(() => {
    if (customElements.get("model-viewer")) return;
    const s = document.createElement("script");
    s.type = "module";
    s.src = "/vendor/model-viewer.min.js";
    document.head.appendChild(s);
  }, []);

  return createElement("model-viewer", {
    src,
    alt,
    "camera-controls": true,
    "auto-rotate": true,
    "shadow-intensity": "1",
    exposure: "1",
    "interaction-prompt": "auto",
    style: { width: "100%", height: "100%", minHeight: "420px", background: "transparent" },
  });
}
