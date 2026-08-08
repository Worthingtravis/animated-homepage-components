import type { NextConfig } from "next";

// `STATIC_EXPORT=1 pnpm build` emits a fully static `out/` for hosts that serve
// files only (Cloudflare Workers static assets). Nothing here is server-rendered
// at request time, so the export is lossless — it just turns off the image
// optimizer, which has no origin to run on.
const staticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(staticExport
    ? {
        output: "export" as const,
        images: { unoptimized: true },
        // `/lab` is both a page and a directory. Without this, export writes
        // `lab.html` next to `lab/`, and static hosts resolve that collision to
        // a 404. `trailingSlash` emits `lab/index.html` instead.
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
