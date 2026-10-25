"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShieldAlert, Home, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function UnauthorizedContent() {
  const searchParams = useSearchParams();
  const requiredRole = searchParams.get("requiredRole") || "Restricted Role";
  const currentRole = searchParams.get("currentRole") || "GUEST";

  return (
    <Card className="border-destructive/30 shadow-xl">
      <CardHeader className="text-center">
        <div className="bg-destructive/10 mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full text-destructive">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <CardTitle className="font-serif text-2xl font-bold text-foreground">
          Access Restricted (403)
        </CardTitle>
        <CardDescription className="text-xs">
          Your current account role does not possess the permissions required to view this
          portal.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <div className="space-y-2 rounded-lg bg-muted p-4 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Your Active Role:</span>
            <Badge variant="secondary" className="font-mono">
              {currentRole}
            </Badge>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-2">
            <span className="text-muted-foreground">Required Authorization:</span>
            <Badge variant="destructive" className="font-mono">
              {requiredRole}
            </Badge>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          The Vabbot Resorts platform uses role-based boundary isolation to prevent cross-portal
          data leakage. Please sign in with an account having the necessary access level.
        </p>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Link href="/auth/signin" className="w-full">
          <Button className="w-full gap-1.5 bg-primary">
            <KeyRound className="h-4 w-4" /> Sign In with Different Role
          </Button>
        </Link>
        <Link href="/" className="w-full">
          <Button variant="outline" className="w-full gap-1.5">
            <Home className="h-4 w-4" /> Return to Public Marketplace
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function UnauthorizedPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
      }
    >
      <UnauthorizedContent />
    </React.Suspense>
  );
}
