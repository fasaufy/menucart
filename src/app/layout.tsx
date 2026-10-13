import type { Metadata, Viewport } from "next";
import { Work_Sans } from "next/font/google";
import "./globals.css";

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MenuCart",
  description: "Turn your weekly menu into one halal-safe grocery list.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Keep bottom sheets above the on-screen keyboard on Android.
  interactiveWidget: "resizes-content",
  themeColor: "#f5f5f3",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${workSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-bg font-sans text-text">
        <div className="mx-auto flex min-h-dvh w-full max-w-app flex-col bg-bg">
          {children}
        </div>
      </body>
    </html>
  );
}
