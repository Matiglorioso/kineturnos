import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Las pruebas de rendimiento compilan aparte (scripts/perf) sin pisar el .next de next dev.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
