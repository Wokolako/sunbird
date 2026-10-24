import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signInSchema } from "@/lib/validators/auth";
import { verifyPhoneOtp } from "@/lib/sms";
import { UserRole } from "@prisma/client";

// Fallback demo users for instant sandbox testing
const DEMO_USERS: Record<
  string,
  { id: string; name: string; email: string; passwordHash: string; role: UserRole }
> = {
  "admin@sunbird.com": {
    id: "demo-admin-id",
    name: "System Administrator",
    email: "admin@sunbird.com",
    passwordHash: "$2a$10$vY35363w18Y1w5Vomf9q0.pM4bK2fG0wY2H.e71GvhG7eN8Ceq5.a",
    role: "ADMIN",
  },
  "owner@lakehaven.com": {
    id: "demo-owner-id",
    name: "Chimwemwe Banda (Owner)",
    email: "owner@lakehaven.com",
    passwordHash: "$2a$10$b5VvJ4c/hT5q0Yy4Q8G9v.QYw8nB4sP6nN0hK8uL9dC7aP2jK8m6u",
    role: "OWNER",
  },
  "manager@lakehaven.com": {
    id: "demo-manager-id",
    name: "Tadala Phiri (GM)",
    email: "manager@lakehaven.com",
    passwordHash: "$2a$10$d7YwZ5s/jU6r1Zx5R9H0w.RZz9oC5tQ7oO1iL9vM0eD8bQ3kL9n7v",
    role: "MANAGER",
  },
  "reception@lakehaven.com": {
    id: "demo-reception-id",
    name: "Kondwani Gondwe (Front Desk)",
    email: "reception@lakehaven.com",
    passwordHash: "$2a$10$e8ZxA6t/kV7s2Ay6S0I1x.SAa0pD6uR8pP2jM0wN1fE9cR4lM0o8w",
    role: "FRONT_DESK",
  },
  "cleaner@lakehaven.com": {
    id: "demo-cleaner-id",
    name: "Mercy Chisale (Housekeeper)",
    email: "cleaner@lakehaven.com",
    passwordHash: "$2a$10$e8ZxA6t/kV7s2Ay6S0I1x.SAa0pD6uR8pP2jM0wN1fE9cR4lM0o8w",
    role: "HOUSEKEEPER",
  },
  "guest@example.com": {
    id: "demo-guest-id",
    name: "Thoko Mwale (Guest)",
    email: "guest@example.com",
    passwordHash: "$2a$10$f9AyB7u/lW8t3Bz7T1J2y.TBb1qE7vS9qQ3kN1xO2gF0dS5mN1p9x",
    role: "GUEST",
  },
};

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  providers: [
    // 1. Email and Password Credentials
    CredentialsProvider({
      id: "credentials",
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const validated = signInSchema.safeParse(credentials);
        if (!validated.success) return null;

        const { email, password } = validated.data;
        const normalizedEmail = email.toLowerCase().trim();

        // Check database
        try {
          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
          });

          if (user && user.passwordHash) {
            const isValid = await bcrypt.compare(password, user.passwordHash);
            if (isValid) {
              return {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                image: user.image,
              };
            }
          }
        } catch (dbErr) {
          console.warn("DB lookup error during authorize:", dbErr);
        }

        // Demo user fallback
        const demo = DEMO_USERS[normalizedEmail];
        if (demo) {
          const validPasswords: Record<string, string> = {
            "admin@sunbird.com": "Admin123456!",
            "owner@lakehaven.com": "Owner123456!",
            "manager@lakehaven.com": "Manager123456!",
            "reception@lakehaven.com": "Staff123456!",
            "cleaner@lakehaven.com": "Staff123456!",
            "guest@example.com": "Guest123456!",
          };

          if (password === validPasswords[normalizedEmail]) {
            return {
              id: demo.id,
              email: demo.email,
              name: demo.name,
              role: demo.role,
              image: null,
            };
          }
        }

        return null;
      },
    }),

    // 2. Phone Number + OTP Authentication Provider
    CredentialsProvider({
      id: "phone-otp",
      name: "Phone Number with OTP",
      credentials: {
        phone: { label: "Phone Number", type: "text" },
        code: { label: "Verification Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.code) {
          return null;
        }

        const { phone, code } = credentials;
        const verification = verifyPhoneOtp(phone, code);

        if (!verification.valid) {
          throw new Error(verification.error || "Invalid OTP code");
        }

        // Find or create user associated with this phone
        try {
          let user = await prisma.user.findFirst({
            where: { phone },
          });

          if (!user) {
            const guestEmail = `guest-${phone.replace(/[^0-9]/g, "").slice(-8)}@vabbotresorts.com`;
            user = await prisma.user.create({
              data: {
                name: `Guest (${phone.slice(-4)})`,
                email: guestEmail,
                phone,
                role: UserRole.GUEST,
                guestProfile: {
                  create: {
                    phone,
                    preferredCurrency: "GBP",
                  },
                },
              },
            });
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
          };
        } catch (err) {
          console.error("Phone OTP auth error:", err);
          return null;
        }
      },
    }),

    // 3. Google OAuth Provider (activated when environment variables are supplied)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),

    // 4. Facebook OAuth Provider (activated when environment variables are supplied)
    ...(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET
      ? [
          FacebookProvider({
            clientId: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
          }),
        ]
      : []),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email!;
        token.role = (user as unknown as { role: UserRole }).role || "GUEST";
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.role = token.role;
      }
      return session;
    },
  },
  secret:
    process.env.NEXTAUTH_SECRET ||
    "development-secret-change-me-in-production-at-least-32-chars-long",
};
