import { SmsProvider, SendSmsResult } from "./sms-provider.interface";

export class TwilioSmsProvider implements SmsProvider {
  readonly name = "TwilioSmsProvider";

  constructor(
    private accountSid = process.env.TWILIO_ACCOUNT_SID,
    private authToken = process.env.TWILIO_AUTH_TOKEN,
    private fromNumber = process.env.TWILIO_PHONE_NUMBER
  ) {}

  async sendOtp(phoneNumber: string, code: string): Promise<SendSmsResult> {
    const body = `Your Vabbot Resorts security code is ${code}. Valid for 5 minutes. Do not share with anyone.`;
    return this.sendNotification(phoneNumber, body);
  }

  async sendNotification(phoneNumber: string, message: string): Promise<SendSmsResult> {
    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      console.warn("⚠️ Twilio credentials missing in environment, falling back to mock delivery.");
      return { success: false, error: "Twilio credentials unconfigured" };
    }

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64");

      const params = new URLSearchParams({
        To: phoneNumber,
        From: this.fromNumber,
        Body: message,
      });

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: errorText };
      }

      const data = (await response.json()) as { sid: string };
      return { success: true, messageId: data.sid };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown SMS delivery failure",
      };
    }
  }
}
