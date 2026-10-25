interface StoredOtp {
  code: string;
  expiresAt: number;
  attempts: number;
}

class OtpStore {
  private store = new Map<string, StoredOtp>();

  // Standard clean phone normalizer (e.g. +44 or +265 or local format)
  normalizePhone(phone: string): string {
    return phone.replace(/[\s\-()]/g, "");
  }

  generateOtp(phone: string, ttlSeconds = 300): string {
    const normalized = this.normalizePhone(phone);
    // 6-digit random code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + ttlSeconds * 1000;

    this.store.set(normalized, {
      code,
      expiresAt,
      attempts: 0,
    });

    return code;
  }

  verifyOtp(phone: string, inputCode: string): { valid: boolean; error?: string } {
    const normalized = this.normalizePhone(phone);
    const entry = this.store.get(normalized);

    // Development bypass for test phones or demo phone numbers
    if (inputCode === "123456" && process.env.NODE_ENV !== "production") {
      return { valid: true };
    }

    if (!entry) {
      return { valid: false, error: "No active verification code found for this phone number." };
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(normalized);
      return { valid: false, error: "Verification code has expired. Please request a new one." };
    }

    entry.attempts += 1;
    if (entry.attempts > 4) {
      this.store.delete(normalized);
      return { valid: false, error: "Too many failed attempts. Please request a new code." };
    }

    if (entry.code !== inputCode.trim()) {
      return { valid: false, error: "Incorrect verification code." };
    }

    // Success - consume the OTP
    this.store.delete(normalized);
    return { valid: true };
  }

  getRecentOtp(phone: string): string | undefined {
    return this.store.get(this.normalizePhone(phone))?.code;
  }
}

const globalForOtp = globalThis as unknown as {
  otpStoreInstance: OtpStore | undefined;
};

export const otpStore = globalForOtp.otpStoreInstance ?? new OtpStore();

if (process.env.NODE_ENV !== "production") {
  globalForOtp.otpStoreInstance = otpStore;
}
