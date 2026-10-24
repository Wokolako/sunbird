import Link from "next/link";
import {
  BedDouble,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Sparkles,
  Filter,
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

const ROOMS_DATA = [
  {
    number: "101",
    type: "Executive Lakeview Suite",
    floor: "1st Floor",
    status: "CLEAN",
    occupied: false,
    notes: "Ready for guest check-in",
  },
  {
    number: "102",
    type: "Executive Lakeview Suite",
    floor: "1st Floor",
    status: "INSPECTED",
    occupied: true,
    notes: "Guest in room (Thoko Mwale)",
  },
  {
    number: "103",
    type: "Executive Lakeview Suite",
    floor: "1st Floor",
    status: "DIRTY",
    occupied: false,
    notes: "Guest departed 10:00. Linen change needed.",
  },
  {
    number: "201",
    type: "Garden Chalet",
    floor: "Ground",
    status: "CLEAN",
    occupied: false,
    notes: "Inspected by housekeeper Mercy",
  },
  {
    number: "202",
    type: "Garden Chalet",
    floor: "Ground",
    status: "MAINTENANCE",
    occupied: false,
    notes: "Air conditioner filter replacement scheduled",
  },
];

export default function RoomsHousekeepingPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
            Room Inventory &amp; Housekeeping Board
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage live room cleanliness, inspection states, and maintenance requests.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Filter className="h-4 w-4" /> Filter Status
          </Button>
          <Button size="sm" className="bg-primary">
            + Add Physical Unit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="border-l-4 border-l-emerald-600">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Clean &amp; Ready
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <span className="text-2xl font-bold text-emerald-700">2 Rooms</span>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-sky-600">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Inspected
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <span className="text-2xl font-bold text-sky-700">1 Room</span>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-600">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Dirty / Turnover
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <span className="text-2xl font-bold text-amber-700">1 Room</span>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <span className="text-2xl font-bold text-destructive">1 Room</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold">Physical Units</CardTitle>
          <CardDescription className="text-xs">
            Housekeeping staff can update status in one tap from mobile tablets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room #</TableHead>
                <TableHead>Room Type</TableHead>
                <TableHead>Floor</TableHead>
                <TableHead>Occupancy</TableHead>
                <TableHead>Housekeeping Status</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ROOMS_DATA.map((r) => (
                <TableRow key={r.number}>
                  <TableCell className="text-sm font-bold text-foreground">
                    {r.number}
                  </TableCell>
                  <TableCell className="text-xs font-medium">{r.type}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {r.floor}
                  </TableCell>
                  <TableCell>
                    {r.occupied ? (
                      <Badge variant="info" className="text-xs">
                        Occupied
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Vacant
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {r.status === "CLEAN" && (
                      <Badge variant="success" className="text-xs">
                        CLEAN
                      </Badge>
                    )}
                    {r.status === "INSPECTED" && (
                      <Badge variant="info" className="text-xs">
                        INSPECTED
                      </Badge>
                    )}
                    {r.status === "DIRTY" && (
                      <Badge variant="warning" className="text-xs">
                        DIRTY
                      </Badge>
                    )}
                    {r.status === "MAINTENANCE" && (
                      <Badge variant="destructive" className="text-xs">
                        MAINTENANCE
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                    {r.notes}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      Update Status
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
