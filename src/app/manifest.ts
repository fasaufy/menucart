import type { MetadataRoute } from "next";

// Installable web app (step 5 groundwork for step 8). Icons are placeholders
// until the creative director's app icon.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MenuCart",
    short_name: "MenuCart",
    description: "Turn your weekly menu into one halal-safe grocery list.",
    start_url: "/plan",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f5f5f3",
    theme_color: "#f5f5f3",
    lang: "en",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
