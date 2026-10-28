import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import "./platform.css";
import "./marketplace.css";

export const metadata: Metadata = {
  title: "Vabbot Resorts | Hotels, Lodges & Houses",
  description: "Find hotels, lodges and houses across Malawi with Vabbot Resorts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="marketplace-page min-h-screen bg-background font-sans text-foreground antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
