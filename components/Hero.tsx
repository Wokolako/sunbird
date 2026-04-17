'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { Search, Calendar as CalendarIcon, Users, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from 'next/image';
import { hotels } from '@/lib/data';

export function Hero() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 overflow-hidden">
        <Image 
          src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1920&auto=format&fit=crop"
          alt="Sunbird Hotels & Resorts Luxury Suite"
          fill
          priority
          sizes="100vw"
          className="object-cover scale-105 animate-slow-zoom"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/40 z-10" />
      </div>

      <div className="relative z-20 h-full flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl"
        >
          <span className="text-white/80 uppercase tracking-[0.5em] text-xs font-bold mb-6 block">
            Welcome to Sunbird Hotels &amp; Resorts
          </span>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-sans font-black text-white mb-8 leading-[1.05] tracking-tighter">
            THE WARM HEART OF <br />
            <span className="text-sunbird-accent">MALAWIAN</span> HOSPITALITY
          </h1>
          <p className="text-white/90 text-lg md:text-xl font-light max-w-2xl mx-auto mb-12 leading-relaxed">
            Discover a world of luxury, comfort, and authentic experiences across Malawi&apos;s most iconic locations.
          </p>
        </motion.div>

        {/* Booking Bar */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full max-w-screen-2xl bg-white dark:bg-[#1a1a1a] shadow-2xl p-2 md:p-4 grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4 items-center"
        >
          {/* Destination */}
          <div className="flex flex-col px-4 py-2 border-r border-sunbird-green/10 dark:border-white/10 last:border-0">
            <label className="text-[10px] uppercase tracking-widest font-bold text-sunbird-green dark:text-sunbird-accent mb-1 flex items-center gap-2">
              <MapPin className="w-3 h-3" /> Destination
            </label>
            <Select>
              <SelectTrigger className="border-0 p-0 h-auto focus:ring-0 text-sm font-medium bg-transparent text-sunbird-green dark:text-white">
                <SelectValue placeholder="Select Hotel" />
              </SelectTrigger>
              <SelectContent>
                {hotels.map((hotel) => (
                  <SelectItem key={hotel.id} value={hotel.id}>
                    {hotel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Check In */}
          <div className="flex flex-col px-4 py-2 border-r border-sunbird-green/10 dark:border-white/10 last:border-0">
            <label className="text-[10px] uppercase tracking-widest font-bold text-sunbird-green dark:text-sunbird-accent mb-1 flex items-center gap-2">
              <CalendarIcon className="w-3 h-3" /> Check In
            </label>
            <Popover>
              <PopoverTrigger 
                render={
                  <button className="text-sm font-medium text-left focus:outline-none text-sunbird-green dark:text-white">
                    {date ? format(date, 'PPP') : 'Select Date'}
                  </button>
                }
              />
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Guests */}
          <div className="flex flex-col px-4 py-2 border-r border-sunbird-green/10 dark:border-white/10 last:border-0">
            <label className="text-[10px] uppercase tracking-widest font-bold text-sunbird-green dark:text-sunbird-accent mb-1 flex items-center gap-2">
              <Users className="w-3 h-3" /> Guests
            </label>
            <Select defaultValue="2">
              <SelectTrigger className="border-0 p-0 h-auto focus:ring-0 text-sm font-medium bg-transparent text-sunbird-green dark:text-white">
                <SelectValue placeholder="Guests" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Adult</SelectItem>
                <SelectItem value="2">2 Adults</SelectItem>
                <SelectItem value="3">3 Adults</SelectItem>
                <SelectItem value="4">4 Adults</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search Button */}
          <Button className="h-full rounded-none bg-sunbird-green text-white hover:bg-sunbird-accent uppercase tracking-[0.2em] text-xs font-bold py-6 md:py-0">
            Check Availability
          </Button>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-white/60 text-[10px] uppercase tracking-widest font-medium">Scroll</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-white/60 to-transparent" />
      </motion.div>
    </section>
  );
}
