import assert from "node:assert/strict";
import {
  canAccessAdmin,
  canAccessDashboard,
  canAccessAccount,
  evaluateRouteAccess,
  PROPERTY_ROLES,
} from "../lib/auth-guard";
import { otpStore } from "../lib/sms/otp-store";
import { MockSmsProvider } from "../lib/sms/mock-sms.provider";
import { signInSchema, signUpSchema } from "../lib/validators/auth";

async function runTests() {
  console.log("=================================================================");
  console.log("🧪 RUNNING AUTHENTICATION & ROLE GUARD LOGIC TEST SUITE");
  console.log("=================================================================\n");

  let passed = 0;
  let failed = 0;

  function test(description: string, fn: () => void | Promise<void>) {
    try {
      const res = fn();
      if (res instanceof Promise) {
        return res
          .then(() => {
            console.log(`  ✅ [PASS] ${description}`);
            passed++;
          })
          .catch((err) => {
            console.error(`  ❌ [FAIL] ${description}`);
            console.error(err);
            failed++;
          });
      } else {
        console.log(`  ✅ [PASS] ${description}`);
        passed++;
      }
    } catch (err) {
      console.error(`  ❌ [FAIL] ${description}`);
      console.error(err);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // 1. Role Permission Matrix Tests
  // ---------------------------------------------------------------------------
  console.log("🔹 1. Role Permission Matrix & Direct Role Helpers");

  test("canAccessAdmin allows only ADMIN role", () => {
    assert.equal(canAccessAdmin("ADMIN"), true);
    assert.equal(canAccessAdmin("OWNER"), false);
    assert.equal(canAccessAdmin("MANAGER"), false);
    assert.equal(canAccessAdmin("FRONT_DESK"), false);
    assert.equal(canAccessAdmin("HOUSEKEEPER"), false);
    assert.equal(canAccessAdmin("GUEST"), false);
    assert.equal(canAccessAdmin(undefined), false);
    assert.equal(canAccessAdmin(null), false);
  });

  test("canAccessDashboard allows all property staff roles plus admin", () => {
    for (const role of PROPERTY_ROLES) {
      assert.equal(canAccessDashboard(role), true, `Expected ${role} to access dashboard`);
    }
    assert.equal(canAccessDashboard("GUEST"), false);
    assert.equal(canAccessDashboard(undefined), false);
    assert.equal(canAccessDashboard(null), false);
  });

  test("canAccessAccount requires authentication", () => {
    assert.equal(canAccessAccount(true), true);
    assert.equal(canAccessAccount(false), false);
  });

  // ---------------------------------------------------------------------------
  // 2. Route Evaluation & Redirection Logic Tests
  // ---------------------------------------------------------------------------
  console.log("\n🔹 2. Route Access Evaluation & Route Guard Logic");

  test("Public routes allow unauthenticated and authenticated users unconditionally", () => {
    const unauthRoot = evaluateRouteAccess("/", false, null);
    assert.equal(unauthRoot.allowed, true);

    const authHotels = evaluateRouteAccess("/hotels", true, "GUEST");
    assert.equal(authHotels.allowed, true);

    const unauthResorts = evaluateRouteAccess("/resorts", false, null);
    assert.equal(unauthResorts.allowed, true);
  });

  test("Unauthenticated user accessing /admin is redirected to /auth/signin with callback", () => {
    const evalRes = evaluateRouteAccess("/admin/users", false, null);
    assert.equal(evalRes.allowed, false);
    assert.ok(evalRes.redirectUrl?.includes("/auth/signin"));
    assert.ok(evalRes.redirectUrl?.includes("callbackUrl"));
  });

  test("Unauthenticated user accessing /dashboard is redirected to /auth/signin with callback", () => {
    const evalRes = evaluateRouteAccess("/dashboard/rooms", false, null);
    assert.equal(evalRes.allowed, false);
    assert.ok(evalRes.redirectUrl?.includes("/auth/signin"));
    assert.ok(evalRes.redirectUrl?.includes("callbackUrl"));
  });

  test("Unauthenticated user accessing /account is redirected to /auth/signin with callback", () => {
    const evalRes = evaluateRouteAccess("/account", false, null);
    assert.equal(evalRes.allowed, false);
    assert.ok(evalRes.redirectUrl?.includes("/auth/signin"));
    assert.ok(evalRes.redirectUrl?.includes("callbackUrl"));
  });

  test("Guest role is blocked from /admin and redirected to unauthorized page", () => {
    const evalRes = evaluateRouteAccess("/admin", true, "GUEST");
    assert.equal(evalRes.allowed, false);
    assert.equal(evalRes.requiredRole, "ADMIN");
    assert.ok(evalRes.redirectUrl?.includes("/auth/unauthorized"));
    assert.ok(evalRes.redirectUrl?.includes("requiredRole=ADMIN"));
    assert.ok(evalRes.redirectUrl?.includes("currentRole=GUEST"));
  });

  test("Property Owner role is blocked from /admin and redirected to unauthorized page", () => {
    const evalRes = evaluateRouteAccess("/admin", true, "OWNER");
    assert.equal(evalRes.allowed, false);
    assert.equal(evalRes.requiredRole, "ADMIN");
    assert.ok(evalRes.redirectUrl?.includes("/auth/unauthorized"));
    assert.ok(evalRes.redirectUrl?.includes("currentRole=OWNER"));
  });

  test("Admin role is allowed into /admin", () => {
    const evalRes = evaluateRouteAccess("/admin/audit", true, "ADMIN");
    assert.equal(evalRes.allowed, true);
    assert.equal(evalRes.redirectUrl, undefined);
  });

  test("Guest role is blocked from /dashboard and redirected with requiredRole message", () => {
    const evalRes = evaluateRouteAccess("/dashboard", true, "GUEST");
    assert.equal(evalRes.allowed, false);
    assert.equal(evalRes.requiredRole, "Property Staff / Manager");
    assert.ok(evalRes.redirectUrl?.includes("/auth/unauthorized"));
  });

  test("Property roles (OWNER, MANAGER, FRONT_DESK, HOUSEKEEPER, ADMIN) are allowed into /dashboard", () => {
    const staffRoles = ["OWNER", "MANAGER", "FRONT_DESK", "HOUSEKEEPER", "ADMIN"];
    for (const role of staffRoles) {
      const evalRes = evaluateRouteAccess("/dashboard/calendar", true, role);
      assert.equal(evalRes.allowed, true, `Role ${role} should be permitted to access dashboard`);
    }
  });

  test("Any authenticated role can access /account", () => {
    const roles = ["GUEST", "OWNER", "MANAGER", "FRONT_DESK", "HOUSEKEEPER", "ADMIN"];
    for (const role of roles) {
      const evalRes = evaluateRouteAccess("/account", true, role);
      assert.equal(evalRes.allowed, true, `Authenticated ${role} should access /account`);
    }
  });

  // ---------------------------------------------------------------------------
  // 3. OTP Engine & Store Verification Tests
  // ---------------------------------------------------------------------------
  console.log("\n🔹 3. Phone OTP Generation, Verification & Expiry Lifecycle");

  test("OTP generation produces a valid 6-digit numeric code", () => {
    const testPhone = "+447700900999";
    const code = otpStore.generateOtp(testPhone);
    assert.equal(typeof code, "string");
    assert.equal(code.length, 6);
    assert.ok(/^\d{6}$/.test(code), "Code must be 6 digits");
  });

  test("OTP verification succeeds with generated code and invalidates code upon use", () => {
    const testPhone = "+447700900888";
    const code = otpStore.generateOtp(testPhone);

    // First verification must succeed
    const firstAttempt = otpStore.verifyOtp(testPhone, code);
    assert.equal(firstAttempt.valid, true);

    // Second verification must fail (replay attack prevention)
    const secondAttempt = otpStore.verifyOtp(testPhone, code);
    assert.equal(secondAttempt.valid, false);
    assert.ok(secondAttempt.error?.includes("No active verification code"));
  });

  test("OTP verification fails when wrong code is supplied", () => {
    const testPhone = "+447700900777";
    otpStore.generateOtp(testPhone);

    const result = otpStore.verifyOtp(testPhone, "000000");
    assert.equal(result.valid, false);
    assert.ok(result.error?.includes("Incorrect"));
  });

  test("OTP invalidates after exceeding maximum retry attempts", () => {
    const testPhone = "+447700900666";
    const realCode = otpStore.generateOtp(testPhone);

    // Fail 5 times
    otpStore.verifyOtp(testPhone, "111111");
    otpStore.verifyOtp(testPhone, "222222");
    otpStore.verifyOtp(testPhone, "333333");
    otpStore.verifyOtp(testPhone, "444444");
    const fifthAttempt = otpStore.verifyOtp(testPhone, "555555");

    assert.equal(fifthAttempt.valid, false);
    assert.ok(fifthAttempt.error?.includes("Too many failed attempts"));

    // Real code should no longer work
    const retryWithReal = otpStore.verifyOtp(testPhone, realCode);
    assert.equal(retryWithReal.valid, false);
  });

  test("OTP with negative or zero TTL expires immediately", () => {
    const testPhone = "+447700900555";
    const code = otpStore.generateOtp(testPhone, -1); // Expired immediately

    const result = otpStore.verifyOtp(testPhone, code);
    assert.equal(result.valid, false);
    assert.ok(result.error?.includes("expired"));
  });

  // ---------------------------------------------------------------------------
  // 4. Pluggable SMS Provider Tests
  // ---------------------------------------------------------------------------
  console.log("\n🔹 4. Pluggable SMS Provider Interface & Mock Implementation");

  await test("MockSmsProvider successfully dispatches OTP and notification", async () => {
    const provider = new MockSmsProvider();
    assert.equal(provider.name, "MockSmsProvider (Development)");

    const otpRes = await provider.sendOtp("+447700900123", "987654");
    assert.equal(otpRes.success, true);
    assert.ok(otpRes.messageId?.startsWith("mock-msg-"));

    const notifRes = await provider.sendNotification("+447700900123", "Your reservation is confirmed.");
    assert.equal(notifRes.success, true);
    assert.ok(notifRes.messageId?.startsWith("mock-msg-"));
  });

  // ---------------------------------------------------------------------------
  // 5. Validation Schemas Tests
  // ---------------------------------------------------------------------------
  console.log("\n🔹 5. Authentication & Registration Validation Schemas");

  test("signInSchema validates correct inputs and rejects invalid ones", () => {
    const valid = signInSchema.safeParse({
      email: "guest@vabbotresorts.com",
      password: "SecretPassword123!",
    });
    assert.equal(valid.success, true);

    const invalidEmail = signInSchema.safeParse({
      email: "not-an-email",
      password: "ValidPassword123!",
    });
    assert.equal(invalidEmail.success, false);

    const shortPassword = signInSchema.safeParse({
      email: "valid@example.com",
      password: "123",
    });
    assert.equal(shortPassword.success, false);
  });

  test("signUpSchema validates guest registration payload", () => {
    const valid = signUpSchema.safeParse({
      name: "Victoria Sterling",
      email: "victoria@example.co.uk",
      password: "StrongPassword123!",
      role: "GUEST",
      phone: "+447700900111",
    });
    assert.equal(valid.success, true);

    const shortName = signUpSchema.safeParse({
      name: "V",
      email: "victoria@example.co.uk",
      password: "StrongPassword123!",
    });
    assert.equal(shortName.success, false);
  });

  console.log("\n=================================================================");
  console.log(`🏁 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log("=================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
