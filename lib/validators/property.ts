import { z } from "zod";

export const propertyCreateSchema = z.object({
  name: z.string().min(3, "Property name must be at least 3 characters"),
  organizationId: z.string().min(1, "Organization is required"),
  type: z
    .enum(["HOTEL", "LODGE", "RESORT", "VILLA", "GUESTHOUSE", "SAFARI_CAMP"])
    .default("LODGE"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  region: z.string().min(2, "Region is required"),
  country: z.string().default("United Kingdom"),
  checkInTime: z.string().default("14:00"),
  checkOutTime: z.string().default("10:00"),
  cancellationPolicy: z.string().optional(),
});

export const roomTypeCreateSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  name: z.string().min(2, "Room type name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  basePrice: z.number().positive("Base price must be greater than 0"),
  capacity: z.number().int().min(1).default(2),
  bedConfig: z.string().min(2, "Bed configuration is required"),
  totalRooms: z.number().int().min(1).default(1),
  amenities: z.array(z.string()).default([]),
});

export type PropertyCreateInput = z.infer<typeof propertyCreateSchema>;
export type RoomTypeCreateInput = z.infer<typeof roomTypeCreateSchema>;
