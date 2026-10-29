import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";

const display = Fredoka({ subsets: ["latin"], variable: "--font-display" });
const body = Nunito({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Brettspiel-Liste",
  description: "Welche Brettspiele wir noch spielen wollen",
};

export const viewport: Viewport = {
  viewportFit: "cover",
  // Android Chrome: the keyboard shrinks the page, so the add sheet stays above it.
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf1de" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1a26" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${display.variable} ${body.variable}`}>
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
