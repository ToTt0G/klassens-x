import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "./ConvexClientProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Klassens Tallrikar – Rösta på klassens utmärkelser",
  description:
    "Skapa en klass, bjud in klasskompisar och rösta på roliga klassutmärkelser som Klassens Pajas, Klassens Solstråle och mer!",
  keywords: ["klassutmärkelser", "klassröstning", "skola", "klassens pajas"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
      <body className="font-inter antialiased">
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
