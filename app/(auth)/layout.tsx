import Link from "next/link";
import { Compass } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#10271f] p-4 sm:p-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(12, 34, 26, 0.68), rgba(12, 34, 26, 0.82)), url('/images/vabbot-resort-hero.jpg')",
        }}
      />
      <div className="relative z-10 mb-6 flex items-center space-x-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-primary-foreground shadow-lg shadow-black/15 backdrop-blur-sm">
          <Compass className="h-6 w-6 text-accent" />
        </div>
        <Link
          href="/"
          className="font-serif text-2xl font-bold tracking-tight text-white"
        >
          Vabbot Resorts
        </Link>
      </div>
      <div className="relative z-10 w-full max-w-md">{children}</div>
      <p className="relative z-10 mt-8 text-center text-xs text-white/60">
        © {new Date().getFullYear()} Vabbot Resorts Ltd. All rights
        reserved.
      </p>
    </div>
  );
}
