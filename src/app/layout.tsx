import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

// Configuration optimisée de la police Inter
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

// Metadata SEO complètes pour Daga Maraka BTP
export const metadata: Metadata = {
  title: {
    default: "Daga Maraka - BTP Ingénierie & Location Matériel",
    template: "%s | Daga Maraka BTP"
  },
  description: "Daga Maraka BTP - Votre partenaire de confiance pour l'ingénierie et la location de matériel de construction. Solutions complètes pour tous vos projets BTP.",
  keywords: [
    "BTP",
    "ingénierie",
    "location matériel",
    "construction",
    "travaux publics",
    "équipement chantier",
    "Daga Maraka",
    "matériel BTP",
    "location engins",
    "gestion projet"
  ],
  authors: [{ name: "Daga Maraka" }],
  creator: "Daga Maraka",
  publisher: "Daga Maraka BTP",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://dagamaraka.com",
    siteName: "Daga Maraka BTP",
    title: "Daga Maraka - BTP Ingénierie & Location Matériel",
    description: "Solutions complètes pour tous vos projets BTP. Ingénierie et location de matériel de construction professionnel.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Daga Maraka BTP - Ingénierie & Location Matériel",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Daga Maraka - BTP Ingénierie & Location Matériel",
    description: "Solutions complètes pour tous vos projets BTP. Ingénierie et location de matériel de construction professionnel.",
    images: ["/og-image.jpg"],
    creator: "@dagamaraka",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" },
    ],
    other: [
      { rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#ea580c" },
    ],
  },
  manifest: "/site.webmanifest",
  category: "business",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="fr" className={inter.variable}>
      <head>
        <meta name="theme-color" content="#ea580c" />
        <meta name="msapplication-TileColor" content="#ea580c" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body 
        className="font-inter antialiased bg-background text-foreground"
        suppressHydrationWarning={true}
      >
        <AuthProvider>
          <div id="root" className="min-h-screen">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
