import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { InventoryProvider } from "@/context/InventoryContext";

/* ─── Typography ───────────────────────────────────────────── */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["600", "700"],
  style: ["normal", "italic"],
});

/* ─── Metadata ─────────────────────────────────────────────── */
export const metadata: Metadata = {
  title: "MaxiCare Pharmacy | Trusted Healthcare, Osun State Nigeria",
  description:
    "MaxiCare Pharmacy serves Osun State families with genuine prescription medications, over-the-counter healthcare products, vitamins, and professional pharmacist consultations.",
  keywords: [
    "MaxiCare Pharmacy",
    "Pharmacy in Osun State",
    "Prescription dispensing Nigeria",
    "Pharmacy Osun State",
    "Healthcare Osun",
    "Medication dispensing Nigeria",
  ],
  openGraph: {
    title: "MaxiCare Pharmacy | Osun State, Nigeria",
    description:
      "Quality prescription dispensing, over-the-counter medicines, and trusted pharmacist guidance for families across Osun State.",
    type: "website",
    locale: "en_NG",
    siteName: "MaxiCare Pharmacy",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b2520",
};

/* ─── Layout ───────────────────────────────────────────────── */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="antialiased min-h-screen font-sans">
        <InventoryProvider>{children}</InventoryProvider>
      </body>
    </html>
  );
}
