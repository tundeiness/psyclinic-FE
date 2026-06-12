import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/Header";
import { AuthBootstrap } from "@/components/AuthBootstrap";
import { ToastContainer } from "@/components/ToastContainer";

export const metadata: Metadata = {
  title: "Cerca Africa Mind & Behaviour Clinic",
  description:
    "Book psychotherapy sessions with Cerca Africa's clinical psychologists.",
  icons: {
    icon: "/favicon.png",
  },
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
    <html lang="en" suppressHydrationWarning>
      <body
        className="min-h-screen text-slate-800 antialiased"
        // Extensions like Grammarly, ColorZilla, and Scribe mutate the
        // <html> and <body> tags after the SSR HTML lands but before
        // React hydrates. Without these flags React treats the mismatch
        // as a hydration crash, and the page becomes
        // non-interactive (paints, but no clicks/scroll work). These
        // flags scope the tolerance to the specific elements extensions
        // are known to touch — not globally.
        suppressHydrationWarning
      >
        <Providers>
          <AuthBootstrap />
          <Header />
          {children}
          <ToastContainer />
        </Providers>
      </body>
    </html>
  );
}
