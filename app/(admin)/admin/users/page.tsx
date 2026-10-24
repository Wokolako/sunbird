import Link from "next/link";
import { Users, UserPlus, Shield, Search } from "lucide-react";
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

const USERS_LIST = [
  {
    name: "System Administrator",
    email: "admin@sunbird.com",
    role: "ADMIN",
    phone: "+265 888 000 001",
    status: "ACTIVE",
  },
  {
    name: "Chimwemwe Banda",
    email: "owner@lakehaven.com",
    role: "OWNER",
    phone: "+265 999 111 222",
    status: "ACTIVE",
  },
  {
    name: "Tadala Phiri",
    email: "manager@lakehaven.com",
    role: "MANAGER",
    phone: "+265 999 333 444",
    status: "ACTIVE",
  },
  {
    name: "Kondwani Gondwe",
    email: "reception@lakehaven.com",
    role: "FRONT_DESK",
    phone: "+265 888 555 666",
    status: "ACTIVE",
  },
  {
    name: "Mercy Chisale",
    email: "cleaner@lakehaven.com",
    role: "HOUSEKEEPER",
    phone: "+265 888 777 888",
    status: "ACTIVE",
  },
  {
    name: "Thoko Mwale",
    email: "guest@example.com",
    role: "GUEST",
    phone: "+265 999 888 777",
    status: "ACTIVE",
  },
];

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-slate-100">
            Platform Users &amp; Role Assignments
          </h1>
          <p className="text-sm text-slate-400">
            View all 6 system roles, inspect active permissions, and manage staff
            credentials.
          </p>
        </div>
      </div>

      <Card className="border-slate-800 bg-slate-950 text-slate-100">
        <CardHeader>
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <Input
              placeholder="Search user name, email, or role..."
              className="h-9 w-full border-slate-700 bg-slate-900 text-slate-200 sm:w-80"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="border-slate-800 bg-slate-900">
              <TableRow className="border-slate-800">
                <TableHead className="text-slate-400">Full Name</TableHead>
                <TableHead className="text-slate-400">Email Address</TableHead>
                <TableHead className="text-slate-400">Role Boundary</TableHead>
                <TableHead className="text-slate-400">Phone</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-right text-slate-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {USERS_LIST.map((u) => (
                <TableRow
                  key={u.email}
                  className="border-slate-800 text-xs hover:bg-slate-900/60"
                >
                  <TableCell className="font-semibold text-slate-200">{u.name}</TableCell>
                  <TableCell className="font-mono text-slate-300">{u.email}</TableCell>
                  <TableCell>
                    {u.role === "ADMIN" && (
                      <Badge
                        variant="destructive"
                        className="border-red-800 bg-red-950 text-xs text-red-300"
                      >
                        ADMIN
                      </Badge>
                    )}
                    {u.role === "OWNER" && (
                      <Badge
                        variant="default"
                        className="border-emerald-800 bg-emerald-950 text-xs text-emerald-300"
                      >
                        OWNER
                      </Badge>
                    )}
                    {u.role === "MANAGER" && (
                      <Badge
                        variant="secondary"
                        className="border-sky-800 bg-sky-950 text-xs text-sky-300"
                      >
                        MANAGER
                      </Badge>
                    )}
                    {u.role === "FRONT_DESK" && (
                      <Badge
                        variant="outline"
                        className="border-slate-700 text-xs text-slate-300"
                      >
                        FRONT_DESK
                      </Badge>
                    )}
                    {u.role === "HOUSEKEEPER" && (
                      <Badge
                        variant="warning"
                        className="border-amber-800 bg-amber-950 text-xs text-amber-300"
                      >
                        HOUSEKEEPER
                      </Badge>
                    )}
                    {u.role === "GUEST" && (
                      <Badge
                        variant="outline"
                        className="border-slate-700 text-xs text-slate-400"
                      >
                        GUEST
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-400">{u.phone}</TableCell>
                  <TableCell>
                    <span className="font-medium text-emerald-400">Active</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 border-slate-700 text-xs text-slate-300 hover:bg-slate-800"
                    >
                      Manage Role
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
