'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Twitter, Linkedin, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Footer() {
  return (
    <footer className="bg-sunbird-light dark:bg-[#0a0a0a] border-t border-sunbird-green/10 dark:border-white/10 pt-24 pb-12 px-6">
      <div className="max-w-screen-2xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
          {/* Brand Column */}
          <div className="flex flex-col gap-8">
            <Link href="/" className="flex items-center group">
              <div className="relative h-16 w-auto">
                <Image 
                  src="/assets/logo.png"
                  alt="Sunbird Hotels & Resorts"
                  width={250}
                  height={64}
                  className="h-full w-auto object-contain dark:brightness-0 dark:invert"
                />
              </div>
            </Link>
            <p className="text-[#6b6b6b] dark:text-white/60 text-sm font-light leading-relaxed">
              Malawi&apos;s premier hotel chain, offering a unique blend of luxury, comfort, and authentic Malawian hospitality across 9 strategic locations.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="w-10 h-10 rounded-full border border-sunbird-green/10 dark:border-white/10 flex items-center justify-center text-sunbird-green dark:text-white hover:bg-sunbird-green hover:text-white transition-all">
                <Facebook className="w-4 h-4" />
              </Link>
              <Link href="#" className="w-10 h-10 rounded-full border border-sunbird-green/10 dark:border-white/10 flex items-center justify-center text-sunbird-green dark:text-white hover:bg-sunbird-green hover:text-white transition-all">
                <Instagram className="w-4 h-4" />
              </Link>
              <Link href="#" className="w-10 h-10 rounded-full border border-sunbird-green/10 dark:border-white/10 flex items-center justify-center text-sunbird-green dark:text-white hover:bg-sunbird-green hover:text-white transition-all">
                <Twitter className="w-4 h-4" />
              </Link>
              <Link href="#" className="w-10 h-10 rounded-full border border-sunbird-green/10 dark:border-white/10 flex items-center justify-center text-sunbird-green dark:text-white hover:bg-sunbird-green hover:text-white transition-all">
                <Linkedin className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-sunbird-green dark:text-white mb-8">Quick Links</h4>
            <ul className="flex flex-col gap-4">
              {['About Us', 'Our Hotels', 'Conferences', 'Dining', 'Special Offers', 'Careers'].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-sm text-[#6b6b6b] dark:text-white/60 hover:text-sunbird-accent transition-colors font-light">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-sunbird-green dark:text-white mb-8">Contact Us</h4>
            <ul className="flex flex-col gap-6">
              <li className="flex gap-4">
                <MapPin className="w-5 h-5 text-sunbird-accent shrink-0" />
                <span className="text-sm text-[#6b6b6b] dark:text-white/60 font-light leading-relaxed">
                  28 Glyn Jones Road, <br />
                  P.O Box 376, Blantyre, Malawi
                </span>
              </li>
              <li className="flex gap-4">
                <Phone className="w-5 h-5 text-sunbird-accent shrink-0" />
                <span className="text-sm text-[#6b6b6b] dark:text-white/60 font-light">
                  +265 1 773 388 / 0885 996 521
                </span>
              </li>
              <li className="flex gap-4">
                <Mail className="w-5 h-5 text-sunbird-accent shrink-0" />
                <span className="text-sm text-[#6b6b6b] dark:text-white/60 font-light">
                  centralres@sunbirdmalawi.com
                </span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-sunbird-green dark:text-white mb-8">Newsletter</h4>
            <p className="text-sm text-[#6b6b6b] dark:text-white/60 font-light mb-6 leading-relaxed">
              Subscribe to receive exclusive offers and updates from Sunbird.
            </p>
            <div className="flex flex-col gap-3">
              <Input 
                placeholder="Email Address" 
                className="rounded-none border-sunbird-green/10 dark:border-white/10 focus:border-sunbird-accent focus:ring-0 bg-transparent"
              />
              <Button className="rounded-none bg-sunbird-green text-white hover:bg-sunbird-accent uppercase tracking-widest text-[10px] font-bold py-6">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-sunbird-green/10 dark:border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] uppercase tracking-widest text-sunbird-green/60 dark:text-white/40 font-medium">
            © {new Date().getFullYear()} Sunbird Tourism PLC. All Rights Reserved.
          </p>
          <div className="flex gap-8">
            <Link href="#" className="text-[10px] uppercase tracking-widest text-sunbird-green/60 dark:text-white/40 hover:text-sunbird-green font-medium">Privacy Policy</Link>
            <Link href="#" className="text-[10px] uppercase tracking-widest text-sunbird-green/60 dark:text-white/40 hover:text-sunbird-green font-medium">Terms of Service</Link>
            <Link href="#" className="text-[10px] uppercase tracking-widest text-sunbird-green/60 dark:text-white/40 hover:text-sunbird-green font-medium">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
