"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Footer() {
  return (
    <footer className="bg-sunbird-light border-sunbird-green/10 border-t px-6 pb-12 pt-24 dark:border-white/10 dark:bg-[#0a0a0a]">
      <div className="mx-auto max-w-screen-2xl">
        <div className="mb-20 grid grid-cols-1 gap-16 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="flex flex-col gap-8">
            <Link href="/" className="group flex items-center">
              <span className="font-serif text-2xl font-bold tracking-tight text-primary">
                Vabbot Resorts
              </span>
            </Link>
            <p className="text-sm font-light leading-relaxed text-[#6b6b6b] dark:text-white/60">
              Premier luxury hospitality group, offering an exquisite portfolio of lakeside retreats,
              countryside lodges, and luxury boutique hotels across the United Kingdom.
            </p>
            <div className="flex gap-4">
              <Link
                href="#"
                className="border-primary/20 text-primary hover:bg-primary flex h-10 w-10 items-center justify-center rounded-full border transition-all hover:text-white dark:border-white/10 dark:text-white"
              >
                <Facebook className="h-4 w-4" />
              </Link>
              <Link
                href="#"
                className="border-primary/20 text-primary hover:bg-primary flex h-10 w-10 items-center justify-center rounded-full border transition-all hover:text-white dark:border-white/10 dark:text-white"
              >
                <Instagram className="h-4 w-4" />
              </Link>
              <Link
                href="#"
                className="border-primary/20 text-primary hover:bg-primary flex h-10 w-10 items-center justify-center rounded-full border transition-all hover:text-white dark:border-white/10 dark:text-white"
              >
                <Twitter className="h-4 w-4" />
              </Link>
              <Link
                href="#"
                className="border-primary/20 text-primary hover:bg-primary flex h-10 w-10 items-center justify-center rounded-full border transition-all hover:text-white dark:border-white/10 dark:text-white"
              >
                <Linkedin className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-primary mb-8 text-xs font-bold uppercase tracking-[0.2em] dark:text-white">
              Quick Links
            </h4>
            <ul className="flex flex-col gap-4">
              {[
                "About Vabbot Resorts",
                "Our Resorts & Lodges",
                "Private Dining & Events",
                "Safari Expeditions",
                "Special Offers",
                "Property Management (PMS)",
              ].map((item) => (
                <li key={item}>
                  <Link
                    href="#"
                    className="hover:text-accent text-sm font-light text-[#6b6b6b] transition-colors dark:text-white/60"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-primary mb-8 text-xs font-bold uppercase tracking-[0.2em] dark:text-white">
              Contact & Concierge
            </h4>
            <ul className="flex flex-col gap-6">
              <li className="flex gap-4">
                <MapPin className="text-accent h-5 w-5 shrink-0" />
                <span className="text-sm font-light leading-relaxed text-[#6b6b6b] dark:text-white/60">
                  Mayfair, London, W1K 6TQ <br />
                  United Kingdom
                </span>
              </li>
              <li className="flex gap-4">
                <Phone className="text-accent h-5 w-5 shrink-0" />
                <span className="text-sm font-light text-[#6b6b6b] dark:text-white/60">
                  +44 20 7946 0912
                </span>
              </li>
              <li className="flex gap-4">
                <Mail className="text-accent h-5 w-5 shrink-0" />
                <span className="text-sm font-light text-[#6b6b6b] dark:text-white/60">
                  concierge@vabbotresorts.com
                </span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-primary mb-8 text-xs font-bold uppercase tracking-[0.2em] dark:text-white">
              Privilege Club
            </h4>
            <p className="mb-6 text-sm font-light leading-relaxed text-[#6b6b6b] dark:text-white/60">
              Subscribe to receive exclusive bespoke invitations, private stay rates, and seasonal safari releases.
            </p>
            <div className="flex flex-col gap-3">
              <Input
                placeholder="Email Address"
                className="border-primary/20 focus:border-accent rounded-none bg-transparent focus:ring-0 dark:border-white/10"
              />
              <Button className="bg-primary hover:bg-primary-800 rounded-none py-6 text-xs font-bold uppercase tracking-widest text-primary-foreground">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        <div className="border-border flex flex-col items-center justify-between gap-6 border-t pt-12 dark:border-white/10 md:flex-row">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-widest">
            © {new Date().getFullYear()} Vabbot Resorts Ltd. All Rights Reserved.
          </p>
          <div className="flex gap-8">
            <Link
              href="#"
              className="text-muted-foreground hover:text-primary text-xs font-medium uppercase tracking-widest"
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              className="text-muted-foreground hover:text-primary text-xs font-medium uppercase tracking-widest"
            >
              Terms of Service
            </Link>
            <Link
              href="#"
              className="text-muted-foreground hover:text-primary text-xs font-medium uppercase tracking-widest"
            >
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
