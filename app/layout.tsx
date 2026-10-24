import type { Metadata } from "next";
import "./globals.css";
import "./marketplace.css";
import { SessionProvider } from "@/components/providers/session-provider";

export const metadata: Metadata = {
  title: "Vabbot Resorts | Luxury Hotel & Lodge Marketplace with Integrated PMS",
  description:
    "Luxury British-African hospitality platform for booking verified luxury lakeside lodges, boutique hotels, and managing property operations with an integrated PMS.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
