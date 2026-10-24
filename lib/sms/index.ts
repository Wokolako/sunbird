import { SmsProvider } from "./sms-provider.interface";
import { MockSmsProvider } from "./mock-sms.provider";
import { TwilioSmsProvider } from "./twilio-sms.provider";
import { otpStore } from "./otp-store";

export * from "./sms-provider.interface";
export * from "./otp-store";

let activeProvider: SmsProvider | null = null;

export function getSmsProvider(): SmsProvider {
  if (!activeProvider) {
    if (process.env.SMS_PROVIDER === "twilio" && process.env.TWILIO_ACCOUNT_SID) {
      activeProvider = new TwilioSmsProvider();
    } else {
      activeProvider = new MockSmsProvider();
    }
  }
  return activeProvider;
}

export async function sendPhoneOtp(phoneNumber: string): Promise<{ success: boolean; code?: string; error?: string }> {
  const code = otpStore.generateOtp(phoneNumber);
  const provider = getSmsProvider();
  const res = await provider.sendOtp(phoneNumber, code);
  if (!res.success) {
    return { success: false, error: res.error };
  }
  return { success: true, code: process.env.NODE_ENV !== "production" ? code : undefined };
}

export function verifyPhoneOtp(phoneNumber: string, code: string): { valid: boolean; error?: string } {
  return otpStore.verifyOtp(phoneNumber, code);
}
