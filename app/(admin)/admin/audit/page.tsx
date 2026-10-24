import Link from "next/link";
import { ShieldAlert, Download, Filter, Search } from "lucide-react";
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

const AUDIT_LOGS = [
  {
    id: "log-1",
    timestamp: "2026-10-22 23:45:10",
    action: "ORGANIZATION_APPROVED",
    user: "admin@sunbird.com",
    role: "ADMIN",
    entity: "Organization: Lake Safari & Resort Collection",
    ip: "197.234.12.4",
  },
  {
    id: "log-2",
    timestamp: "2026-10-22 23:40:02",
    action: "PROPERTY_PUBLISHED",
    user: "owner@lakehaven.com",
    role: "OWNER",
    entity: "Property: Lake Haven Luxury Resort & Lodge",
    ip: "102.164.88.9",
  },
  {
    id: "log-3",
    timestamp: "2026-10-22 22:15:30",
    action: "BOOKING_CONFIRMED",
    user: "system_webhook",
    role: "SYSTEM",
    entity: "Booking: #SB-2026-8941 (Paid \u00a3555)",
    ip: "41.190.2.14",
  },
  {
    id: "log-4",
    timestamp: "2026-10-22 20:00:15",
    action: "ROOM_STATUS_CHANGE",
    user: "cleaner@lakehaven.com",
    role: "HOUSEKEEPER",
    entity: "Room 101: Changed status to CLEAN",
    ip: "102.164.88.11",
  },
];

export default function AuditTrailPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-slate-100">
            Platform Audit Trail &amp; Security Log
          </h1>
          <p className="text-sm text-slate-400">
            Append-only tamper-resistant event logs tracking administrative and
            operational actions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-slate-800 text-slate-300 hover:bg-slate-800"
          >
            <Download className="h-4 w-4" /> Export Audit Log
          </Button>
        </div>
      </div>

      <Card className="border-slate-800 bg-slate-950 text-slate-100">
        <CardHeader>
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <Input
              placeholder="Filter by action, email, or entity..."
              className="h-9 w-full border-slate-700 bg-slate-900 text-slate-200 sm:w-80"
            />
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="border-slate-800 text-xs">
                All Actions
              </Button>
              <Button size="sm" variant="ghost" className="text-xs text-slate-400">
                Auth Events
              </Button>
              <Button size="sm" variant="ghost" className="text-xs text-slate-400">
                Price Adjustments
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="border-slate-800 bg-slate-900">
              <TableRow className="border-slate-800">
                <TableHead className="text-slate-400">Timestamp (UTC)</TableHead>
                <TableHead className="text-slate-400">Action Type</TableHead>
                <TableHead className="text-slate-400">Actor Email</TableHead>
                <TableHead className="text-slate-400">Role</TableHead>
                <TableHead className="text-slate-400">Target Entity</TableHead>
                <TableHead className="text-right text-slate-400">IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {AUDIT_LOGS.map((log) => (
                <TableRow
                  key={log.id}
                  className="border-slate-800 font-mono text-xs hover:bg-slate-900/60"
                >
                  <TableCell className="text-slate-400">{log.timestamp}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="border-amber-500/30 bg-amber-500/10 text-xs text-amber-400"
                    >
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-sans text-slate-300">{log.user}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="bg-slate-800 text-xs text-slate-300"
                    >
                      {log.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-sans text-slate-300">{log.entity}</TableCell>
                  <TableCell className="text-right text-slate-500">{log.ip}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
