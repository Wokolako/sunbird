export interface SendSmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SmsProvider {
  readonly name: string;
  sendOtp(phoneNumber: string, code: string): Promise<SendSmsResult>;
  sendNotification(phoneNumber: string, message: string): Promise<SendSmsResult>;
}
