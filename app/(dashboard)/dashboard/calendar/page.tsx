import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Sliders,
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

export default function CalendarPage() {
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
            Availability &amp; Rate Calendar
          </h1>
          <p className="text-sm text-muted-foreground">
            View room availability, set nightly prices, and adjust minimum length of stay.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1">
            <ChevronLeft className="h-4 w-4" /> Prev Week
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            Next Week <ChevronRight className="h-4 w-4" />
          </Button>
          <Button size="sm" className="gap-1.5 bg-primary">
            <Sliders className="h-3.5 w-3.5" /> Bulk Price Update
          </Button>
        </div>
      </div>

      <Card className="overflow-x-auto">
        <CardHeader>
          <CardTitle className="text-base font-bold">
            14-Day PMS Availability Matrix
          </CardTitle>
          <CardDescription className="text-xs">
            Green indicates open units available for booking on marketplace; Red indicates
            sold out.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="min-w-[700px]">
            {/* Header Dates */}
            <div className="grid-cols-15 grid border-b border-border pb-2 text-center text-xs font-semibold">
              <div className="text-left font-bold text-foreground">Room Type</div>
              {days.map((d, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className="text-xs text-muted-foreground">
                    {d.toLocaleDateString("en-US", { weekday: "narrow" })}
                  </span>
                  <span className="text-xs font-bold text-foreground">{d.getDate()}</span>
                </div>
              ))}
            </div>

            {/* Row 1: Executive Suite */}
            <div className="grid-cols-15 grid items-center border-b border-border py-3 text-xs">
              <div className="pr-2">
                <strong className="block text-xs font-semibold">Executive Suite</strong>
                <span className="text-xs text-muted-foreground">£185 / night</span>
              </div>
              {days.map((_, i) => (
                <div key={i} className="text-center">
                  {i === 2 || i === 3 ? (
                    <span className="inline-block w-8 rounded bg-amber-100 py-1 text-xs font-bold text-amber-800">
                      1
                    </span>
                  ) : (
                    <span className="inline-block w-8 rounded bg-emerald-100 py-1 text-xs font-bold text-emerald-800">
                      4
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Row 2: Garden Chalet */}
            <div className="grid-cols-15 grid items-center py-3 text-xs">
              <div className="pr-2">
                <strong className="block text-xs font-semibold">Garden Chalet</strong>
                <span className="text-xs text-muted-foreground">£120 / night</span>
              </div>
              {days.map((_, i) => (
                <div key={i} className="text-center">
                  <span className="inline-block w-8 rounded bg-emerald-100 py-1 text-xs font-bold text-emerald-800">
                    {6 - (i % 3)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
