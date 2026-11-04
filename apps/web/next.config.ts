import path from "node:path";
import type { NextConfig } from "next";

const config: NextConfig = {
  output: "standalone",
  // monorepo: trace files from the workspace root so standalone output includes workspace packages
  outputFileTracingRoot: path.join(import.meta.dirname, "../../"),
  transpilePackages: ["@xadboom/db"],
  poweredByHeader: false,
};

export default config;
