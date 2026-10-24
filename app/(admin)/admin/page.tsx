import Link from "next/link";
import {
  TrendingUp,
  Building2,
  Users,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Check,
  X,
  FileText,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Admin Title */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
            Platform Command Center
          </h1>
          <p className="text-sm text-slate-400">
            UK Nationwide Operations • 24 Registered Lodges • System Uptime 99.98%
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/properties">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-200 hover:bg-slate-800"
            >
              Verify Properties (3)
            </Button>
          </Link>
          <Link href="/admin/audit">
            <Button
              size="sm"
              className="gap-1.5 bg-amber-600 text-white hover:bg-amber-700"
            >
              <FileText className="h-4 w-4" /> View Audit Logs
            </Button>
          </Link>
        </div>
      </div>

      {/* Platform Metric Tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-800 bg-slate-950 text-slate-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-400">
              Gross Marketplace Volume
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">£342K</div>
            <p className="mt-1 text-xs text-slate-400">
              Platform Commission: £34.2K (10%)
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-950 text-slate-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-400">
              Active Properties
            </CardTitle>
            <Building2 className="h-4 w-4 text-sky-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">18 Published</div>
            <p className="mt-1 text-xs text-slate-400">6 In Setup / Draft</p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-950 text-slate-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-400">
              Pending KYC Verification
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">3 Organizations</div>
            <p className="mt-1 text-xs text-slate-400">
              Requires tax &amp; tourism license check
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-950 text-slate-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-400">
              Platform Accounts
            </CardTitle>
            <Users className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">240 Users</div>
            <p className="mt-1 text-xs text-slate-400">198 Guests, 42 Staff / Owners</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Verifications Queue */}
      <Card className="border-slate-800 bg-slate-950 text-slate-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-100">
                Organization &amp; KYC Verification Queue
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Unverified organizations cannot publish listings to the public
                marketplace.
              </CardDescription>
            </div>
            <Link href="/admin/properties">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-amber-400 hover:text-amber-300"
              >
                All Properties →
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="border-slate-800 bg-slate-900">
              <TableRow className="border-slate-800">
                <TableHead className="text-slate-400">Organization Name</TableHead>
                <TableHead className="text-slate-400">Owner Contact</TableHead>
                <TableHead className="text-slate-400">Tax ID (TPIN)</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Submitted</TableHead>
                <TableHead className="text-right text-slate-400">Decision</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="border-slate-800 hover:bg-slate-900/60">
                <TableCell className="font-semibold text-slate-200">
                  Lake Safari &amp; Resort Collection
                  <span className="block text-xs text-slate-400">
                    Lake Haven Luxury Resort &amp; Lodge
                  </span>
                </TableCell>
                <TableCell className="text-xs text-slate-300">
                  Chimwemwe Banda
                  <span className="block text-xs text-slate-500">
                    owner@lakehaven.com
                  </span>
                </TableCell>
                <TableCell className="font-mono text-xs text-slate-300">
                  TPIN-MW-2024-9842
                </TableCell>
                <TableCell>
                  <Badge variant="success" className="text-xs">
                    APPROVED
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-slate-400">Oct 19, 2026</TableCell>
                <TableCell className="text-right">
                  <span className="text-xs font-semibold text-emerald-400">
                    Active &amp; Published
                  </span>
                </TableCell>
              </TableRow>

              <TableRow className="border-slate-800 hover:bg-slate-900/60">
                <TableCell className="font-semibold text-slate-200">
                  Peak District Wilderness Expeditions
                  <span className="block text-xs text-slate-400">
                    Peak District Alpine Chalets
                  </span>
                </TableCell>
                <TableCell className="text-xs text-slate-300">
                  Aubrey Chirwa
                  <span className="block text-xs text-slate-500">
                    aubrey@peakwild.co.uk
                  </span>
                </TableCell>
                <TableCell className="font-mono text-xs text-slate-300">
                  GB-UTR-2025-1044
                </TableCell>
                <TableCell>
                  <Badge variant="warning" className="text-xs">
                    PENDING_AUDIT
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-slate-400">Yesterday</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 border-emerald-600/40 text-xs text-emerald-400 hover:bg-emerald-950/40"
                    >
                      <Check className="mr-1 h-3 w-3" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 border-red-600/40 text-xs text-red-400 hover:bg-red-950/40"
                    >
                      <X className="mr-1 h-3 w-3" /> Reject
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
