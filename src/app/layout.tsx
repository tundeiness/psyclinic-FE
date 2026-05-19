import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "PsyClinic",
  description: "Clinical psychology practice — book sessions with therapists.",
};

// Mobile-first: correct scaling on iOS/Android, supports notch safe areas.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#266f68",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-brand-50 text-slate-800 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
