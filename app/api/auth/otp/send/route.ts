import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendPhoneOtp } from "@/lib/sms";

const sendOtpSchema = z.object({
  phone: z
    .string()
    .min(7, "Phone number must be at least 7 characters")
    .max(20, "Phone number too long"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = sendOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid phone number" },
        { status: 400 }
      );
    }

    const { phone } = parsed.data;
    const result = await sendPhoneOtp(phone);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to dispatch verification SMS" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification code sent successfully",
      // Include code in development mode for easy testing
      devCode: result.code,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
