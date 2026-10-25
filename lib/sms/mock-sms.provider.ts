import { SmsProvider, SendSmsResult } from "./sms-provider.interface";

export class MockSmsProvider implements SmsProvider {
  readonly name = "MockSmsProvider (Development)";

  async sendOtp(phoneNumber: string, code: string): Promise<SendSmsResult> {
    console.log("----------------------------------------------------------------");
    console.log(`📱 [MOCK SMS PROVIDER] To: ${phoneNumber}`);
    console.log(`🔐 Your Vabbot Resorts verification code is: ${code}`);
    console.log(`⏰ Code valid for 5 minutes.`);
    console.log("----------------------------------------------------------------");

    return {
      success: true,
      messageId: `mock-msg-${Date.now()}`,
    };
  }

  async sendNotification(phoneNumber: string, message: string): Promise<SendSmsResult> {
    console.log(`📱 [MOCK SMS PROVIDER] Notification to ${phoneNumber}: ${message}`);
    return {
      success: true,
      messageId: `mock-msg-${Date.now()}`,
    };
  }
}
