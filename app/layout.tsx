import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vabbot Resorts | Stays across Malawi',
  description: 'Find verified hotels, lodges, guesthouses and short-term stays across Malawi.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

