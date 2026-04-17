'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Menu, X, Phone, Globe, User, LogOut } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/components/auth-context';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const navLinks = [
  { name: 'Hotels', href: '/hotels' },
  { name: 'Resorts', href: '/resorts' },
  { name: 'Dining', href: '/dining' },
  { name: 'Conferences', href: '/conferences' },
  { name: 'Offers', href: '/offers' },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const { user, login, logout } = useAuth();

  React.useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4',
        isScrolled ? 'bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent'
      )}
    >
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center group">
          <div className={cn("relative h-12 w-auto", !isScrolled && "brightness-0 invert")}>
            <Image 
              src="/assets/logo.png"
              alt="Sunbird Hotels & Resorts"
              width={200}
              height={48}
              className="h-full w-auto object-contain"
              priority
            />
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "text-[10px] uppercase tracking-[0.2em] font-bold transition-all duration-300 hover:text-sunbird-accent relative group",
                isScrolled ? "text-sunbird-green dark:text-white" : "text-white"
              )}
            >
              {link.name}
              <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-sunbird-accent transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          
          {mounted ? (
            <>
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "rounded-full p-0 overflow-hidden border border-sunbird-green/10", isScrolled ? "text-sunbird-green dark:text-white" : "text-white")}>
                        <Image src={user.picture} alt={user.name} width={32} height={32} className="rounded-full" />
                      </button>
                    }
                  />
                  <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-[#1a1a1a] border-sunbird-green/10">
                    <div className="flex items-center gap-2 p-3 border-b border-sunbird-green/10">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-sunbird-green dark:text-white">{user.name}</span>
                        <span className="text-xs text-[#6b6b6b] dark:text-white/60">{user.email}</span>
                      </div>
                    </div>
                    <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive cursor-pointer">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={login}
                  className={cn(
                    "rounded-full",
                    isScrolled ? "text-sunbird-green dark:text-white" : "text-white"
                  )}
                >
                  <User className="w-5 h-5" />
                </Button>
              )}

              {/* Mobile Menu */}
              <Sheet>
                <SheetTrigger
                  render={
                    <button 
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "icon" }),
                        "md:hidden", 
                        isScrolled ? "text-sunbird-green dark:text-white" : "text-white"
                      )}
                    >
                      <Menu className="w-6 h-6" />
                    </button>
                  }
                />
                <SheetContent side="right" className="bg-sunbird-light dark:bg-[#0a0a0a] border-l-sunbird-green/10 dark:border-white/10">
                  <div className="sr-only">
                    <SheetTitle>Navigation Menu</SheetTitle>
                    <SheetDescription>Access all pages and booking options.</SheetDescription>
                  </div>
                  <div className="flex flex-col gap-8 mt-12">
                    {navLinks.map((link) => (
                      <Link
                        key={link.name}
                        href={link.href}
                        className="text-2xl font-sans font-black uppercase tracking-tight text-sunbird-green dark:text-white hover:text-sunbird-accent"
                      >
                        {link.name}
                      </Link>
                    ))}
                    <div className="mt-8 pt-8 border-t border-sunbird-green/10 dark:border-white/10 flex flex-col gap-4">
                      <div className="flex items-center gap-3 text-sunbird-green dark:text-white">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm">+265 1 773 388</span>
                      </div>
                      <Button className="w-full rounded-none bg-sunbird-green text-white uppercase tracking-widest py-6">
                        Book Your Stay
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-white/10" />
              <div className="w-8 h-8 md:hidden bg-white/10" />
            </div>
          )}

          <Button 
            className={cn(
              "rounded-none px-8 uppercase tracking-widest text-xs font-bold transition-all",
              isScrolled 
                ? "bg-sunbird-green text-white hover:bg-sunbird-accent" 
                : "bg-white text-sunbird-green hover:bg-sunbird-accent hover:text-white"
            )}
          >
            Book Now
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
