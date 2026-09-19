import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    "https://zettabyte-icu4.vercel.app"
  ),

  title: {
    default: "ZettaByte",
    template: "%s | ZettaByte",
  },

  description:
    "Tienda online de tecnología ZettaByte",

  icons: {
    icon: "/zettabyte.jpeg",
    shortcut: "/zettabyte.jpeg",
    apple: "/zettabyte.jpeg",
  },

  openGraph: {
    title: "ZettaByte",
    description:
      "Tienda online de tecnología ZettaByte",
    url: "/",
    siteName: "ZettaByte",

    images: [
      {
        url: "/zettabyte.jpeg",
        width: 1200,
        height: 630,
        alt: "ZettaByte - Tienda de tecnología",
      },
    ],

    locale: "es_CO",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "ZettaByte",
    description:
     "Tecnología a tu alcance",
    images: ["/zettabyte.jpeg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}