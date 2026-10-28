"use client";

import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "./SiteShell";

export function GuestAccount() {
  const { isLoaded, isSignedIn, user } = useUser();
  return (
    <>
      <SiteHeader />
      <main className="shell account-page">
        <div className="section-title">
          <div>
            <h1>Your Vabbot account.</h1>
            <p>
              Keep your identity, saved stays, and booking requests in one secure place.
            </p>
          </div>
          {isSignedIn && <UserButton />}
        </div>
        {!isLoaded ? (
          <div className="card" role="status">
            Loading your account...
          </div>
        ) : isSignedIn ? (
          <div className="grid-2">
            <section className="card">
              <h2>Welcome, {user.firstName || user.fullName || "traveller"}.</h2>
              <p>{user.primaryEmailAddress?.emailAddress}</p>
              <div className="form-actions">
                <Link href="/bookings" className="button">
                  View my stays
                </Link>
                <Link href="/saved" className="button secondary">
                  Saved stays
                </Link>
              </div>
            </section>
            <aside className="card">
              <h2>Account security</h2>
              <p>
                Clerk manages sign-in, sessions, verified email addresses, and account
                security for Vabbot Resorts.
              </p>
            </aside>
          </div>
        ) : (
          <div className="grid-2">
            <section className="card">
              <h2>Sign in to continue.</h2>
              <p>Access your saved properties and stay requests from any device.</p>
              <div className="form-actions">
                <SignInButton mode="modal">
                  <button className="button">Sign in</button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="button secondary">Create guest account</button>
                </SignUpButton>
              </div>
            </section>
            <aside className="card">
              <h2>One account for every stay.</h2>
              <p>
                Save places, request rooms, review booking status, and manage
                cancellations.
              </p>
            </aside>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
