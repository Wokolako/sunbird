'use client';

import * as React from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { CheckCircle2, Users, Briefcase, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: <Briefcase className="w-6 h-6" />,
    title: 'Premier Conferences',
    description: 'State-of-the-art facilities for meetings, incentives, conferences, and exhibitions.'
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Corporate Partnerships',
    description: 'Tailored solutions and exclusive rates for our corporate partners across Malawi.'
  },
  {
    icon: <Award className="w-6 h-6" />,
    title: 'Award-Winning Service',
    description: 'Consistently recognized for excellence in hospitality and business services.'
  }
];

export function CorporateSection() {
  return (
    <section className="py-24 px-6 bg-sunbird-green dark:bg-[#052d1a] text-white overflow-hidden">
      <div className="max-w-screen-2xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-sunbird-accent uppercase tracking-[0.3em] text-xs font-bold mb-6 block">
              Corporate &amp; Business
            </span>
            <h2 className="text-4xl md:text-5xl font-sans font-black mb-8 leading-[1.1] tracking-tight">
              ELEVATING YOUR <br />
              <span className="text-sunbird-accent italic">BUSINESS</span> EXPERIENCE
            </h2>
            <p className="text-white/70 text-lg font-light leading-relaxed mb-10">
              Sunbird Hotels &amp; Resorts is the preferred choice for business travelers in Malawi. 
              We provide the perfect environment for productivity, networking, and high-level corporate events.
            </p>

            <div className="space-y-8 mb-12">
              {features.map((feature, index) => (
                <div key={index} className="flex gap-6">
                  <div className="text-sunbird-accent shrink-0">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="text-lg font-sans font-bold mb-2">{feature.title}</h4>
                    <p className="text-white/60 text-sm font-light leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Button className="rounded-none bg-sunbird-accent text-white hover:bg-white hover:text-sunbird-green uppercase tracking-widest text-xs font-bold px-10 py-6">
              Corporate Inquiry
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative aspect-square max-w-md mx-auto">
              <div className="absolute inset-0 border border-sunbird-accent/30 translate-x-6 translate-y-6" />
              <Image
                src="https://images.unsplash.com/photo-1541971875076-8f970d573be6?q=80&w=800&auto=format&fit=crop"
                alt="Sunbird Hotel Exterior"
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            
            {/* Floating Stat */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute -bottom-10 -left-10 bg-sunbird-accent p-8 hidden md:block"
            >
              <div className="text-4xl font-sans font-black mb-1">9</div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-white/80">
                Strategic Locations <br /> Across Malawi
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
