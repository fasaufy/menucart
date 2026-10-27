import type { MetadataRoute } from "next";

// Installable web app. Icons are rendered from the Figma app icon
// ("menucart logo"); the maskable one keeps the basket inside the safe zone.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MenuCart",
    short_name: "MenuCart",
    description: "Turn your weekly menu into one halal-safe grocery list.",
    start_url: "/plan",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7f8f2",
    theme_color: "#f7f8f2",
    lang: "en",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
