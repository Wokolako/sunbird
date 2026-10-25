import Link from "next/link";
import { Building2, Check, X, ShieldCheck, Eye, Search } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PROPERTIES = [
  {
    name: "Windermere Lakeside Retreat & Lodge",
    city: "Lake District, Cumbria",
    type: "RESORT",
    org: "Lakeside Retreat Collection",
    rooms: 10,
    published: true,
    kyc: "APPROVED",
  },
  {
    name: "Cotswolds Country Estate",
    city: "Cotswolds, Gloucestershire",
    type: "LODGE",
    org: "Country Estates UK Ltd",
    rooms: 8,
    published: true,
    kyc: "APPROVED",
  },
  {
    name: "Peak District Alpine Chalets",
    city: "Peak District, Derbyshire",
    type: "LODGE",
    org: "Peak District Wilderness Expeditions",
    rooms: 6,
    published: false,
    kyc: "PENDING",
  },
];

export default function AdminPropertiesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-slate-100">
            Property &amp; Organization Oversight
          </h1>
          <p className="text-sm text-slate-400">
            Review business registration licenses, approve listings, and control public
            visibility.
          </p>
        </div>
      </div>

      <Card className="border-slate-800 bg-slate-950 text-slate-100">
        <CardHeader>
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <Input
              placeholder="Search lodge name, location, or organization..."
              className="h-9 w-full border-slate-700 bg-slate-900 text-slate-200 sm:w-80"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="border-slate-800 bg-slate-900">
              <TableRow className="border-slate-800">
                <TableHead className="text-slate-400">Property</TableHead>
                <TableHead className="text-slate-400">Organization</TableHead>
                <TableHead className="text-slate-400">Type</TableHead>
                <TableHead className="text-slate-400">Units</TableHead>
                <TableHead className="text-slate-400">KYC Status</TableHead>
                <TableHead className="text-slate-400">Public Marketplace</TableHead>
                <TableHead className="text-right text-slate-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PROPERTIES.map((p) => (
                <TableRow
                  key={p.name}
                  className="border-slate-800 text-xs hover:bg-slate-900/60"
                >
                  <TableCell className="font-semibold text-slate-200">
                    {p.name}
                    <span className="block text-xs font-normal text-slate-400">
                      {p.city}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-300">{p.org}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-slate-700 text-xs">
                      {p.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-slate-300">
                    {p.rooms} units
                  </TableCell>
                  <TableCell>
                    {p.kyc === "APPROVED" ? (
                      <Badge variant="success" className="text-xs">
                        VERIFIED
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="text-xs">
                        PENDING
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {p.published ? (
                      <span className="inline-flex items-center gap-1 font-medium text-emerald-400">
                        ● Live
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-medium text-slate-500">
                        ○ Draft
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 border-slate-700 text-xs text-slate-300 hover:bg-slate-800"
                    >
                      Audit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
