import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brettspiel-Liste",
  description: "Welche Brettspiele wir noch spielen wollen",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
