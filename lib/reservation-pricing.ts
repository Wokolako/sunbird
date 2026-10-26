import { Prisma } from "@prisma/client";

export function calculateBaseRoomTotal(nightlyRate: Prisma.Decimal, nights: number) {
  return nightlyRate.mul(nights).toDecimalPlaces(2);
}
