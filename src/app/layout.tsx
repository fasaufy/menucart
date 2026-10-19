import type { Metadata, Viewport } from "next";
import { Funnel_Display, Funnel_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { AiQueueRunner } from "@/components/AiQueueRunner";
import { OfflineBanner } from "@/components/OfflineBanner";
import { OfflineSupport } from "@/components/OfflineSupport";
import { SyncManager } from "@/components/SyncManager";
import { AI_GENERATION_ENABLED } from "@/lib/ai-config";
import { AUTH_ENABLED } from "@/lib/auth-config";
import "./globals.css";

const funnelSans = Funnel_Sans({
  variable: "--font-funnel-sans",
  subsets: ["latin"],
});

const funnelDisplay = Funnel_Display({
  variable: "--font-funnel-display",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "MenuCart",
  description: "Turn your weekly menu into one halal-safe grocery list.",
  applicationName: "MenuCart",
  appleWebApp: { capable: true, title: "MenuCart", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Keep bottom sheets above the on-screen keyboard on Android.
  interactiveWidget: "resizes-content",
  themeColor: "#f7f8f2",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const shell = (
    <OfflineSupport>
      <div className="mx-auto flex min-h-dvh w-full max-w-app flex-col bg-page">
        <OfflineBanner />
        {AI_GENERATION_ENABLED && <AiQueueRunner />}
        {children}
      </div>
    </OfflineSupport>
  );
  return (
    <html lang="en" className={`${funnelSans.variable} ${funnelDisplay.variable} h-full antialiased`}>
      <body className="min-h-full bg-bg font-sans text-text">
        {AUTH_ENABLED ? (
          <ClerkProvider>
            <SyncManager />
            {shell}
          </ClerkProvider>
        ) : (
          shell
        )}
      </body>
    </html>
  );
}
