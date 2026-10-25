"use client";
import Link from "next/link";
import { Waves } from "lucide-react";
import { MarketplaceHeader } from "./MarketplaceHeader";
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Vabbot Resorts home">
      <Waves size={32} strokeWidth={1.5} />
      <span>
        vabbot<span className="brand-sub">RESORTS</span>
      </span>
    </Link>
  );
}
export function SiteHeader() {
  return <MarketplaceHeader />;
}
export function SiteFooter() {
  return (
    <footer className="foot">
      <div className="shell">
        <div className="footer-main">
          <div>
            <Brand />
            <p>
              A little closer to somewhere special.
              <br />
              Find a hotel, lodge or house for your next stay.
            </p>
          </div>
          <div>
            <strong>Explore</strong>
            <Link href="/search">Find accommodation</Link>
            <Link href="/saved">Saved stays</Link>
            <Link href="/bookings">My stays</Link>
          </div>
          <div>
            <strong>Your account</strong>
            <Link href="/account">Sign in or create an account</Link>
            <Link href="/bookings">Stay requests</Link>
          </div>
        </div>
        <div className="foot-inner">
          <span>© {new Date().getFullYear()} Vabbot Resorts</span>
          <span>Hotels, lodges and houses across Malawi</span>
        </div>
      </div>
    </footer>
  );
}
