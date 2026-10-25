"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Compass, Menu, X, User } from "lucide-react";
export function MarketplaceHeader() {
 const [open,setOpen]=useState(false); const pathname=usePathname();
 const links=[{href:"/search",label:"Find a stay"},{href:"/hotels",label:"Hotels & lodges"},{href:"/saved",label:"Saved"},{href:"/bookings",label:"My stays"}];
 return <header className="sticky top-0 z-40 border-b border-border bg-card"><div className="container relative flex h-20 items-center justify-between gap-3 px-4 sm:px-8">
 <Link href="/" aria-label="Vabbot Resorts home" className="flex shrink-0 items-center gap-2 text-primary"><Compass className="h-7 w-7"/><span className="font-serif text-xl">Vabbot Resorts</span></Link>
 <nav aria-label="Guest navigation" className={`${open?"flex":"hidden"} absolute left-4 right-4 top-full flex-col gap-2 rounded-md border border-border bg-card p-4 md:static md:flex md:flex-row md:gap-5 md:border-0 md:p-0`}>{links.map(l=><Link key={l.href} href={l.href} aria-current={pathname===l.href?"page":undefined} className="py-1 text-sm hover:text-primary" onClick={()=>setOpen(false)}>{l.label}</Link>)}</nav>
 <div className="flex items-center gap-2"><Link href="/account" className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"><User size={16}/><span className="hidden sm:inline">My account</span></Link><button className="p-2 md:hidden" aria-label={open?"Close navigation":"Open navigation"} aria-expanded={open} onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button></div>
 </div></header>;
}
