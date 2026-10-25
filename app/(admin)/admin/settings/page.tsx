import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  Database,
  FileClock,
  KeyRound,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ADMIN_SETTINGS = [
  {
    title: "Property & verification",
    description:
      "Review property applications, business documents, and listing visibility.",
    href: "/admin/properties",
    action: "Manage properties",
    icon: Building2,
    label: "Operations",
  },
  {
    title: "Users & permissions",
    description:
      "Review platform accounts and role assignments for guests and property teams.",
    href: "/admin/users",
    action: "Manage users",
    icon: Users,
    label: "Access",
  },
  {
    title: "Audit & security",
    description:
      "Inspect administrative activity and security events recorded by the platform.",
    href: "/admin/audit",
    action: "View audit trail",
    icon: FileClock,
    label: "Security",
  },
];

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-amber-500/30 bg-amber-500/10 text-amber-300"
          >
            CONTROL CENTER
          </Badge>
        </div>
        <h1 className="font-serif text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
          Platform settings
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">
          Manage key operational areas and review how the platform is configured.
        </p>
      </div>

      <section aria-labelledby="admin-settings-heading" className="space-y-3">
        <div>
          <h2
            id="admin-settings-heading"
            className="text-sm font-semibold text-slate-200"
          >
            Administrative controls
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Open a control area to review or manage its settings.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {ADMIN_SETTINGS.map((setting) => {
            const Icon = setting.icon;

            return (
              <Card
                key={setting.title}
                className="flex h-full flex-col border-slate-800 bg-slate-950 text-slate-100"
              >
                <CardHeader className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-300">
                      <Icon aria-hidden="true" className="h-5 w-5" />
                    </div>
                    <Badge
                      variant="outline"
                      className="border-slate-700 text-slate-400"
                    >
                      {setting.label}
                    </Badge>
                  </div>
                  <div className="space-y-1.5">
                    <CardTitle className="text-base text-slate-100">
                      {setting.title}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed text-slate-400">
                      {setting.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="mt-auto pt-0">
                  <Link
                    href={setting.href}
                    className="inline-flex min-h-9 items-center gap-2 rounded-md border border-slate-700 px-3 text-xs font-semibold text-slate-200 transition-colors hover:border-amber-500/40 hover:bg-slate-900 hover:text-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  >
                    {setting.action}
                    <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="configuration-heading" className="space-y-3">
        <div>
          <h2
            id="configuration-heading"
            className="text-sm font-semibold text-slate-200"
          >
            Application configuration
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Sensitive infrastructure settings are intentionally managed outside
            the browser.
          </p>
        </div>

        <Card className="border-slate-800 bg-slate-950 text-slate-100">
          <CardContent className="grid gap-0 divide-y divide-slate-800 p-0 md:grid-cols-2 md:divide-x md:divide-y-0">
            <div className="flex gap-3 p-5">
              <div className="mt-0.5 text-emerald-400">
                <Database aria-hidden="true" className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">
                  Database connection
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  Connection details are supplied through the server
                  environment. They are not displayed or editable here.
                </p>
              </div>
            </div>
            <div className="flex gap-3 p-5">
              <div className="mt-0.5 text-sky-400">
                <KeyRound aria-hidden="true" className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">
                  Authentication credentials
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  Session secrets and identity-provider credentials are managed
                  as deployment environment variables.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-950/60 p-4">
        <ShieldCheck
          aria-hidden="true"
          className="mt-0.5 h-4 w-4 shrink-0 text-amber-400"
        />
        <p className="text-xs leading-relaxed text-slate-400">
          <span className="font-semibold text-slate-300">Admin access only.</span>{" "}
          Changes made in the linked areas follow their existing permissions and
          audit flows. Deployment credentials are never exposed in this console.
        </p>
        <Settings2 aria-hidden="true" className="ml-auto hidden h-4 w-4 text-slate-600 sm:block" />
      </div>
    </div>
  );
}
