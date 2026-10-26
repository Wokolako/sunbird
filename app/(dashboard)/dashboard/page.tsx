import Link from "next/link";
import {
  BedDouble,
  TrendingUp,
  LogIn,
  LogOut,
  Sparkles,
  ArrowUpRight,
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

export default function DashboardOverviewPage() {
  return (
    <div className="space-y-6">
      {/* Top Welcome Title */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-800">
            Live operations · Front desk
          </p>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Operational Overview &amp; Movement
          </h1>
          <p className="text-sm text-muted-foreground">
            Windermere Lakeside Retreat & Lodge • 10 Total Units • Lake District Lakefront
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/calendar">
            <Button variant="outline" size="sm">
              View Calendar
            </Button>
          </Link>
          <Link href="/dashboard/rooms">
            <Button size="sm" className="bg-primary">
              Housekeeping Board
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Today&apos;s Occupancy
            </CardTitle>
            <BedDouble className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">70.0%</div>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <span className="flex items-center font-semibold text-emerald-600">
                +12% <ArrowUpRight className="h-3 w-3" />
              </span>
              vs last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Expected Arrivals
            </CardTitle>
            <LogIn className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">2 Stays</div>
            <p className="mt-1 text-xs text-muted-foreground">1 Checked in, 1 Pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Departures Today
            </CardTitle>
            <LogOut className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">1 Check-out</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Room 103 (Executive Suite)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Housekeeping Queue
            </CardTitle>
            <Sparkles className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">1 Dirty / 1 Maint.</div>
            <p className="mt-1 text-xs text-muted-foreground">3 Clean &amp; Inspected</p>
          </CardContent>
        </Card>
      </div>

      <section
        aria-label="Property performance charts"
        className="grid gap-4 lg:grid-cols-3"
      >
        <Card className="overflow-hidden border-emerald-100 bg-gradient-to-br from-white to-emerald-50/40 lg:col-span-2">
          <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base font-bold">
                Weekly Occupancy Trend
              </CardTitle>
              <CardDescription className="mt-1 text-xs">
                Illustrative occupancy across the last seven days
              </CardDescription>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-800">
              <TrendingUp className="h-3 w-3" />
              Sample trend
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-48 w-full">
              <svg
                aria-label="Illustrative occupancy trend: 64, 71, 68, 79, 86, 91, and 70 percent from Monday through today"
                className="h-full w-full"
                role="img"
                viewBox="0 0 340 160"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="occupancy-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.24" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.01" />
                  </linearGradient>
                </defs>
                {[16, 44, 72, 100, 128].map((y, index) => (
                  <g key={y}>
                    <line
                      x1="34"
                      x2="326"
                      y1={y}
                      y2={y}
                      stroke="#e7eee8"
                      strokeDasharray="3 4"
                    />
                    <text x="25" y={y + 3} fill="#84918a" fontSize="8" textAnchor="end">
                      {100 - index * 25}
                    </text>
                  </g>
                ))}
                <path
                  d="M 38 56 C 55 52 69 46 85 48 S 118 54 132 52 S 165 42 179 40 S 212 32 226 32 S 259 27 273 26 S 306 43 320 50 L 320 128 L 38 128 Z"
                  fill="url(#occupancy-fill)"
                />
                <path
                  d="M 38 56 C 55 52 69 46 85 48 S 118 54 132 52 S 165 42 179 40 S 212 32 226 32 S 259 27 273 26 S 306 43 320 50"
                  fill="none"
                  stroke="#047857"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                />
                {(
                  [
                    ["Mon", 38],
                    ["Tue", 85],
                    ["Wed", 132],
                    ["Thu", 179],
                    ["Fri", 226],
                    ["Sat", 273],
                    ["Today", 320],
                  ] as const
                ).map(([day, x]) => (
                  <text
                    key={day}
                    x={x}
                    y="148"
                    fill="#748078"
                    fontSize="8"
                    textAnchor="middle"
                  >
                    {day}
                  </text>
                ))}
              </svg>
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Demo visualization only; connect property data for live reporting.
            </p>
          </CardContent>
        </Card>

        <Card className="border-sky-100 bg-gradient-to-br from-white to-sky-50/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Reservation Channels</CardTitle>
            <CardDescription className="text-xs">
              Sample bookings shown below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-2">
              <svg
                aria-label="Two sample reservations: one marketplace and one front desk direct"
                className="h-36 w-36"
                role="img"
                viewBox="0 0 120 120"
              >
                <circle
                  cx="60"
                  cy="60"
                  r="44"
                  fill="none"
                  stroke="#e8edf0"
                  strokeWidth="14"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="44"
                  fill="none"
                  stroke="#047857"
                  strokeDasharray="138.23 138.23"
                  strokeWidth="14"
                  transform="rotate(-90 60 60)"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="44"
                  fill="none"
                  stroke="#38bdf8"
                  strokeDasharray="138.23 138.23"
                  strokeDashoffset="138.23"
                  strokeWidth="14"
                  transform="rotate(-90 60 60)"
                />
                <text
                  x="60"
                  y="57"
                  fill="#243c34"
                  fontSize="22"
                  fontWeight="700"
                  textAnchor="middle"
                >
                  2
                </text>
                <text x="60" y="72" fill="#748078" fontSize="8" textAnchor="middle">
                  SAMPLE
                </text>
              </svg>
            </div>
            <div className="border-border/70 space-y-2 border-t pt-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-700" />
                  Marketplace
                </span>
                <span className="font-semibold text-foreground">1 booking</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
                  Front desk direct
                </span>
                <span className="font-semibold text-foreground">1 booking</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Room Status Visual Grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">Physical Room Board</CardTitle>
              <CardDescription className="text-xs">
                Real-time room occupancy and housekeeping cleaning states.
              </CardDescription>
            </div>
            <Link href="/dashboard/rooms">
              <Button variant="ghost" size="sm" className="text-xs">
                Manage All Rooms →
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div className="rounded-lg border border-border bg-emerald-50/50 p-3 text-center">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">Room 101</span>
                <Badge variant="success" className="px-1 py-0 text-[9px]">
                  Clean
                </Badge>
              </div>
              <span className="block text-xs font-medium text-emerald-800">Vacant</span>
              <span className="block text-xs text-muted-foreground">Exec Suite</span>
            </div>

            <div className="rounded-lg border border-border bg-sky-50/50 p-3 text-center">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">Room 102</span>
                <Badge variant="info" className="px-1 py-0 text-[9px]">
                  Occupied
                </Badge>
              </div>
              <span className="block text-xs font-medium text-sky-800">Thoko Mwale</span>
              <span className="block text-xs text-muted-foreground">Exec Suite</span>
            </div>

            <div className="rounded-lg border border-border bg-amber-50/50 p-3 text-center">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">Room 103</span>
                <Badge variant="warning" className="px-1 py-0 text-[9px]">
                  Dirty
                </Badge>
              </div>
              <span className="block text-xs font-medium text-amber-800">
                Check-out Today
              </span>
              <span className="block text-xs text-muted-foreground">Exec Suite</span>
            </div>

            <div className="rounded-lg border border-border bg-emerald-50/50 p-3 text-center">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">Room 201</span>
                <Badge variant="success" className="px-1 py-0 text-[9px]">
                  Clean
                </Badge>
              </div>
              <span className="block text-xs font-medium text-emerald-800">
                Vacant Ready
              </span>
              <span className="block text-xs text-muted-foreground">Garden Chalet</span>
            </div>

            <div className="bg-destructive/10 rounded-lg border border-border p-3 text-center">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">Room 202</span>
                <Badge variant="destructive" className="px-1 py-0 text-[9px]">
                  Maint.
                </Badge>
              </div>
              <span className="block text-xs font-medium text-destructive">
                A/C Servicing
              </span>
              <span className="block text-xs text-muted-foreground">Garden Chalet</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Reservations Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">
                Today&apos;s Reservations &amp; In-House Guests
              </CardTitle>
              <CardDescription className="text-xs">
                Active booking folios from both Sunbird Marketplace and direct telephone
                walk-ins.
              </CardDescription>
            </div>
            <Link href="/dashboard/reservations">
              <Button variant="outline" size="sm" className="text-xs">
                View All Folios
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking Ref</TableHead>
                <TableHead>Guest Name</TableHead>
                <TableHead>Room Type</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono text-xs font-bold text-primary">
                  #SB-2026-8941
                </TableCell>
                <TableCell className="font-medium">Thoko Mwale</TableCell>
                <TableCell>Executive Lakeview Suite (Rm 102)</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  Nov 14 - Nov 17 (3n)
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    Marketplace
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="success" className="text-xs">
                    CONFIRMED
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-bold">£555</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-xs font-bold text-primary">
                  #SB-2026-8942
                </TableCell>
                <TableCell className="font-medium">Chisomo Kumwenda</TableCell>
                <TableCell>Garden Chalet (Rm 201)</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  Today - Tomorrow (1n)
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    Front Desk Direct
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="info" className="text-xs">
                    CHECKED_IN
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-bold">£120</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
