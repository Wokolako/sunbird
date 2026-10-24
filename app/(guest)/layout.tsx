"use client";

import * as React from "react";
import Link from "next/link";
import { Compass } from "lucide-react";
import { MarketplaceHeader } from "@/components/MarketplaceHeader";

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketplaceHeader />

      {/* Main Guest Content */}
      <main className="flex-1">{children}</main>

      {/* Marketplace Footer */}
      <footer className="border-t border-border bg-card">
        <div className="container px-4 py-10 sm:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div>
              <div className="mb-3 flex items-center space-x-2">
                <Compass className="h-5 w-5 text-accent" />
                <span className="font-serif text-lg font-bold text-primary">
                  Vabbot Resorts
                </span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                UK &amp; East Africa luxury hospitality marketplace connecting discerning
                guests with exclusive lakeside sanctuaries, wildlife safari camps, and
                luxury boutique hotels with an integrated PMS.
              </p>
            </div>
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">
                Destinations
              </h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>Lake District (Windermere &amp; Keswick)</li>
                <li>Cotswolds &amp; Bath</li>
                <li>Scottish Highlands &amp; Cairngorms</li>
                <li>London &amp; Edinburgh City Stays</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">
                Portals &amp; Access
              </h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>
                  <Link href="/account" className="hover:text-primary">
                    Guest Account (/account)
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-primary">
                    Property PMS Dashboard (/dashboard)
                  </Link>
                </li>
                <li>
                  <Link href="/admin" className="hover:text-primary">
                    Platform Super Admin (/admin)
                  </Link>
                </li>
                <li>
                  <Link href="/auth/signin" className="hover:text-primary">
                    Role Sign In Portal
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">
                Trust &amp; Security
              </h4>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Every listed property undergoes business registration verification and
                physical inventory audit. Role-based session isolation guarantees
                operational privacy.
              </p>
            </div>
          </div>
          <div className="mt-8 flex flex-col items-center justify-between border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
            <p>© {new Date().getFullYear()} Vabbot Resorts Ltd. All rights reserved.</p>
            <div className="mt-2 flex space-x-4 sm:mt-0">
              <span>Currency: £ GBP</span>
              <span>•</span>
              <span>Next.js App Router</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
