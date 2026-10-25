import Link from "next/link";
import { PlusCircle, Search, Filter, Download } from "lucide-react";
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

export default function ReservationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
            Reservations &amp; Folios
          </h1>
          <p className="text-sm text-muted-foreground">
            Search, manage, and process check-in/out folios across all room types.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button size="sm" className="gap-1.5 bg-primary">
            <PlusCircle className="h-4 w-4 text-accent" /> New Reservation
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="relative w-full sm:w-72">
              <Input placeholder="Search guest name or #folio..." className="h-9" />
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              <Button variant="outline" size="sm" className="text-xs">
                All
              </Button>
              <Button variant="ghost" size="sm" className="text-xs">
                Confirmed
              </Button>
              <Button variant="ghost" size="sm" className="text-xs">
                Checked In
              </Button>
              <Button variant="ghost" size="sm" className="text-xs">
                Departed
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking Ref</TableHead>
                <TableHead>Guest</TableHead>
                <TableHead>Room Type</TableHead>
                <TableHead>Check-In</TableHead>
                <TableHead>Check-Out</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono text-xs font-bold text-primary">
                  #SB-2026-8941
                </TableCell>
                <TableCell className="text-xs font-medium">
                  Thoko Mwale
                  <span className="block text-xs text-muted-foreground">
                    +265 999 888 777
                  </span>
                </TableCell>
                <TableCell className="text-xs">Executive Lakeview Suite</TableCell>
                <TableCell className="text-xs">Nov 14, 2026</TableCell>
                <TableCell className="text-xs">Nov 17, 2026</TableCell>
                <TableCell>
                  <Badge variant="success" className="text-xs">
                    PAID (£555)
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="success" className="text-xs">
                    CONFIRMED
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono text-xs">£0.00</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
