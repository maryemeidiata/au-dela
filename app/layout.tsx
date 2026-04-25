import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Au-delà — Your Night Sky Tonight",
  description:
    "A personal night sky tracker. Real-time star maps, ISS passes, visible planets, and upcoming space events for your exact location.",
  openGraph: {
    title: "Au-delà",
    description: "Look up. Something is always there.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full" style={{ background: "#06070f" }}>
        {children}
      </body>
    </html>
  );
}
