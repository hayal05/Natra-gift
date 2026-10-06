import type { Metadata, Viewport } from "next";
import "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "NatraGift — Make someone's day",
  description: "Create a beautiful digital gift that opens like a letter.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#fbf7f2] font-sans text-stone-900 antialiased">{children}</body>
    </html>
  );
}
