import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
});

export const metadata: Metadata = {
  title: 'Sunbird Hotels & Resorts | Luxury Hospitality in Malawi',
  description: 'Experience the warmth of Malawian hospitality with Sunbird Hotels & Resorts. Book your stay at our premier hotels and resorts.',
};

import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/components/auth-context';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable, playfair.variable)} suppressHydrationWarning>
      <body className="antialiased bg-sunbird-light dark:bg-[#0a0a0a] text-sunbird-green dark:text-white" suppressHydrationWarning>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
