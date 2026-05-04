import type { Metadata } from "next";
import { Epilogue, Be_Vietnam_Pro, Space_Grotesk } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "./ConvexClientProvider";

const epilogue = Epilogue({
  subsets: ["latin"],
  variable: "--font-epilogue",
  display: "swap",
  weight: ["800", "900"],
});

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin"],
  variable: "--font-be-vietnam",
  display: "swap",
  weight: ["500", "700"],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
  weight: ["700"],
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
    <html lang="sv" className={`${epilogue.variable} ${beVietnamPro.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
      <body className="bg-brick-texture antialiased">
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
