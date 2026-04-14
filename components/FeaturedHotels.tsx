'use client';

import * as React from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { ArrowRight, Star, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { hotels } from '@/lib/data';

export function FeaturedHotels() {
  return (
    <section id="hotels" className="py-24 px-6 bg-sunbird-light dark:bg-[#0a0a0a]">
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="max-w-2xl">
            <span className="text-sunbird-accent uppercase tracking-[0.3em] text-xs font-bold mb-4 block">
              Our Properties
            </span>
            <h2 className="text-4xl md:text-5xl font-serif text-sunbird-green dark:text-white mb-6">
              Iconic Destinations, <br />
              <span className="italic">Unforgettable</span> Stays
            </h2>
            <p className="text-[#6b6b6b] dark:text-white/70 text-lg font-light leading-relaxed">
              From the bustling business hubs of Blantyre and Lilongwe to the serene shores of Lake Malawi, 
              discover our collection of premier hotels and resorts.
            </p>
          </div>
          <Button variant="outline" className="rounded-none border-sunbird-green text-sunbird-green dark:text-white dark:border-white hover:bg-sunbird-green hover:text-white uppercase tracking-widest text-xs font-bold px-8">
            View All Properties
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {hotels.map((hotel, index) => (
            <motion.div
              key={hotel.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group cursor-pointer"
            >
              <div className="relative aspect-[4/5] overflow-hidden mb-6">
                <Image
                  src={hotel.image}
                  alt={hotel.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 left-4">
                  <Badge className="bg-white/90 dark:bg-black/80 text-sunbird-green dark:text-sunbird-accent hover:bg-white rounded-none uppercase tracking-widest text-[10px] py-1 px-3">
                    {hotel.type === 'city' ? 'City Hotel' : 'Resort'}
                  </Badge>
                </div>
                <div className="absolute inset-0 bg-sunbird-green/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Button className="rounded-none bg-white text-sunbird-green hover:bg-sunbird-accent hover:text-white uppercase tracking-widest text-xs font-bold px-8">
                    Explore
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1 text-sunbird-accent">
                  <Star className="w-3 h-3 fill-current" />
                  <span className="text-xs font-bold">{hotel.rating}</span>
                </div>
                <span className="text-xs font-medium text-sunbird-green/60 dark:text-white/40 uppercase tracking-widest">
                  From ${hotel.price} / Night
                </span>
              </div>
              
              <h3 className="text-2xl font-serif text-sunbird-green dark:text-white mb-2 group-hover:text-sunbird-accent transition-colors">
                {hotel.name}
              </h3>
              
              <div className="flex items-center gap-2 text-[#6b6b6b] dark:text-white/60 text-sm mb-4">
                <MapPin className="w-4 h-4" />
                <span>{hotel.location}</span>
              </div>
              
              <p className="text-[#6b6b6b] dark:text-white/50 text-sm font-light line-clamp-2 leading-relaxed">
                {hotel.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
