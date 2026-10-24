import Link from "next/link";
import { Compass } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-muted/40 flex min-h-screen flex-col items-center justify-center p-4 sm:p-8">
      <div className="mb-6 flex items-center space-x-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
          <Compass className="h-6 w-6 text-accent" />
        </div>
        <Link
          href="/"
          className="font-serif text-2xl font-bold tracking-tight text-primary"
        >
          Vabbot Resorts
        </Link>
      </div>
      <div className="w-full max-w-md">{children}</div>
      <p className="mt-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Vabbot Resorts Ltd. All rights
        reserved.
      </p>
    </div>
  );
}
