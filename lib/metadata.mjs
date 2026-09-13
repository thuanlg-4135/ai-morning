import { basePath, siteUrl } from "./site.mjs";

export const absoluteUrl = (path) => `${siteUrl}${basePath}${path}`;
export const shareImage = (date) => ({
  url: absoluteUrl(`/assets/social/${date || "default"}.jpg`),
  width: 1200,
  height: 630,
  alt: date ? `AI Morning · ${date}` : "AI Morning",
});

export function pageMetadata({
  title,
  description,
  path,
  language = "vi",
  date,
}) {
  const url = absoluteUrl(path);
  const image = shareImage(date);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "AI Morning",
      locale: language === "en" ? "en_US" : "vi_VN",
      type: "website",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
