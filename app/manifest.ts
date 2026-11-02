import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Brettspiel-Liste",
    short_name: "Brettspiele",
    description: "Welche Brettspiele wir noch spielen wollen",
    lang: "de",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf1de",
    theme_color: "#fbf1de",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
