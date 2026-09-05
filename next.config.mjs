const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/ai-morning";

export default {
  output: "export",
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
  poweredByHeader: false,
  experimental: { globalNotFound: true },
};
