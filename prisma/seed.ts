import {
  PrismaClient,
  UserRole,
  PropertyType,
  PropertyStatus,
  StaffRole,
  RoomUnitStatus,
  ReservationStatus,
  ReservationSource,
  IdVerificationStatus,
  PaymentMethod,
  PaymentStatus,
  PaymentType,
  InvoiceStatus,
  RateRuleType,
  DateBlockReason,
  PayoutSchedule,
  PayoutStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting complete PMS & Marketplace database seed...");

  // 1. Password hashes
  const adminPasswordHash = await bcrypt.hash("Admin123456!", 10);
  const ownerPasswordHash = await bcrypt.hash("Owner123456!", 10);
  const managerPasswordHash = await bcrypt.hash("Manager123456!", 10);
  const staffPasswordHash = await bcrypt.hash("Staff123456!", 10);
  const guestPasswordHash = await bcrypt.hash("Guest123456!", 10);

  // 2. Clear old data in order of foreign key constraints
  console.log("🧹 Clearing existing data...");
  await prisma.auditLog.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.commissionSetting.deleteMany();
  await prisma.message.deleteMany();
  await prisma.review.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.reservationAddOn.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.dateBlock.deleteMany();
  await prisma.rateRule.deleteMany();
  await prisma.roomUnit.deleteMany();
  await prisma.roomCategory.deleteMany();
  await prisma.propertyPhoto.deleteMany();
  await prisma.propertyAmenity.deleteMany();
  await prisma.amenity.deleteMany();
  await prisma.propertyStaff.deleteMany();
  await prisma.property.deleteMany();
  await prisma.guestProfile.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // 3. Create Users for all 6 roles
  console.log("👤 Creating platform users for every role...");
  const adminUser = await prisma.user.create({
    data: {
      name: "System Administrator",
      email: "admin@sunbird.com",
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      phone: "+44 20 7946 0001",
    },
  });

  const ownerUser = await prisma.user.create({
    data: {
      name: "Edward Sterling",
      email: "owner@lakehaven.com",
      passwordHash: ownerPasswordHash,
      role: UserRole.OWNER,
      phone: "+44 7700 900111",
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      name: "Charlotte Pemberton",
      email: "manager@lakehaven.com",
      passwordHash: managerPasswordHash,
      role: UserRole.MANAGER,
      phone: "+44 7700 900333",
    },
  });

  const frontDeskUser = await prisma.user.create({
    data: {
      name: "James Whitfield",
      email: "reception@lakehaven.com",
      passwordHash: staffPasswordHash,
      role: UserRole.FRONT_DESK,
      phone: "+44 7700 900555",
    },
  });

  const housekeeperUser = await prisma.user.create({
    data: {
      name: "Sarah Caldwell",
      email: "cleaner@lakehaven.com",
      passwordHash: staffPasswordHash,
      role: UserRole.HOUSEKEEPER,
      phone: "+44 7700 900777",
    },
  });

  const guestUser = await prisma.user.create({
    data: {
      name: "Eleanor Vance",
      email: "guest@example.com",
      passwordHash: guestPasswordHash,
      role: UserRole.GUEST,
      phone: "+44 7700 900888",
    },
  });

  // 4. Create Guest Profile
  console.log("📋 Creating guest profile...");
  await prisma.guestProfile.create({
    data: {
      userId: guestUser.id,
      phone: "+44 7700 900888",
      address: "14 Kensington Church Street",
      city: "London",
      stateOrRegion: "Greater London",
      country: "United Kingdom",
      emergencyContactName: "Alistair Vance",
      emergencyContactPhone: "+44 7700 900199",
      idOrPassportNumber: "GB-PASS-884920",
      nationality: "British",
      preferredCurrency: "GBP",
      paymentMethodPref: "CREDIT_CARD",
      specialRequests:
        "Prefers high floor or lakeside view rooms; allergic to shellfish.",
    },
  });

  // 5. Create Amenities
  console.log("✨ Seeding amenities catalog...");
  const wifi = await prisma.amenity.create({
    data: {
      name: "High-Speed Wi-Fi",
      slug: "high-speed-wifi",
      icon: "wifi",
      category: "GENERAL",
    },
  });
  const pool = await prisma.amenity.create({
    data: {
      name: "Swimming Pool",
      slug: "swimming-pool",
      icon: "waves",
      category: "OUTDOOR",
    },
  });
  const beach = await prisma.amenity.create({
    data: {
      name: "Private Lakefront",
      slug: "private-lakefront",
      icon: "umbrella",
      category: "OUTDOOR",
    },
  });
  const restaurant = await prisma.amenity.create({
    data: {
      name: "Fine Dining Restaurant",
      slug: "fine-dining-restaurant",
      icon: "utensils",
      category: "GENERAL",
    },
  });
  const ac = await prisma.amenity.create({
    data: {
      name: "Air Conditioning",
      slug: "air-conditioning",
      icon: "wind",
      category: "ROOM",
    },
  });
  const conference = await prisma.amenity.create({
    data: {
      name: "Executive Boardroom",
      slug: "executive-boardroom",
      icon: "presentation",
      category: "GENERAL",
    },
  });

  // 6. Create Flagship Properties
  console.log("🏨 Seeding properties (Lodge & Hotel)...");
  const lodgeProperty = await prisma.property.create({
    data: {
      name: "Windermere Lakeside Retreat & Lodge",
      legalName: "Windermere Hospitality Ltd",
      slug: "windermere-lakeside-retreat-lodge",
      type: PropertyType.LODGE,
      status: PropertyStatus.APPROVED,
      registrationNumber: "BR-2023-88941",
      taxId: "GB-UTR-2024-9842",
      description:
        "An idyllic lakeside retreat situated along the shores of Lake Windermere in the heart of the Lake District. Features luxury suites, sunset boat tours, fine countryside dining, and curated fell-walking excursions.",
      address: "Lakeside Drive, Bowness-on-Windermere",
      city: "Windermere",
      stateOrRegion: "Cumbria",
      country: "United Kingdom",
      latitude: 54.38,
      longitude: -2.94,
      starRating: 4.8,
      contactEmail: "info@lakehaven.com",
      contactPhone: "+44 15394 42200",
      website: "https://lakehaven.co.uk",
      rules:
        "Check-in from 14:00. Quiet hours from 22:00 to 07:00. Swimming pool open 06:00 to 20:00.",
      quietHours: "22:00 - 07:00",
      petsAllowed: false,
      smokingAllowed: false,
      checkInTime: "14:00",
      checkOutTime: "10:30",
      cancellationPolicy:
        "Full refund up to 48 hours prior to check-in. 50% refund within 48 hours.",
      staff: {
        create: [
          { userId: ownerUser.id, role: StaffRole.OWNER },
          { userId: managerUser.id, role: StaffRole.MANAGER },
          { userId: frontDeskUser.id, role: StaffRole.FRONT_DESK },
          { userId: housekeeperUser.id, role: StaffRole.HOUSEKEEPER },
        ],
      },
      amenities: {
        create: [
          { amenityId: wifi.id, isFeatured: true },
          { amenityId: pool.id, isFeatured: true },
          { amenityId: beach.id, isFeatured: true },
          { amenityId: restaurant.id, isFeatured: true },
          { amenityId: ac.id, isFeatured: false },
        ],
      },
      photos: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
            caption: "Aerial view of Windermere shoreline and infinity pool",
            isHero: true,
            displayOrder: 1,
          },
          {
            url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
            caption: "Executive Lakeview Suite balcony view",
            isHero: false,
            displayOrder: 2,
          },
          {
            url: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80",
            caption: "Private sunset lakeside lounge and restaurant",
            isHero: false,
            displayOrder: 3,
          },
        ],
      },
    },
  });

  const hotelProperty = await prisma.property.create({
    data: {
      name: "Mayfair Boutique Hotel",
      legalName: "Mayfair Hotels Ltd",
      slug: "mayfair-boutique-hotel",
      type: PropertyType.HOTEL,
      status: PropertyStatus.APPROVED,
      registrationNumber: "BR-2022-77210",
      taxId: "GB-UTR-2022-4411",
      description:
        "Contemporary boutique corporate hotel in the heart of Mayfair, London. Ideal for business travelers and conference attendees.",
      address: "Berkeley Square, Mayfair",
      city: "London",
      stateOrRegion: "Greater London",
      country: "United Kingdom",
      latitude: 51.509,
      longitude: -0.145,
      starRating: 4.6,
      contactEmail: "reservations@mayfairhotel.co.uk",
      contactPhone: "+44 20 7499 3400",
      checkInTime: "13:00",
      checkOutTime: "11:00",
      cancellationPolicy: "Free cancellation until 24 hours before check-in.",
      amenities: {
        create: [
          { amenityId: wifi.id, isFeatured: true },
          { amenityId: conference.id, isFeatured: true },
          { amenityId: ac.id, isFeatured: true },
        ],
      },
    },
  });

  // 7. Create Room Categories
  console.log("🛏️ Seeding room categories...");
  const suiteCategory = await prisma.roomCategory.create({
    data: {
      propertyId: lodgeProperty.id,
      name: "Executive Lakeview Suite",
      slug: "executive-lakeview-suite",
      description:
        "Expansive 65m² luxury suite with panoramic views of Lake Windermere, a private veranda, spa bath, and king-size pillow-top bed.",
      capacity: 2,
      maxAdults: 2,
      maxChildren: 1,
      bedArrangement: "1 King Bed",
      basePrice: 285.0, // GBP
      amenities: [
        "Panoramic Lake View",
        "Private Balcony",
        "Air Conditioning",
        "Espresso Machine",
        "Mini Bar",
      ],
    },
  });

  const chaletCategory = await prisma.roomCategory.create({
    data: {
      propertyId: lodgeProperty.id,
      name: "Garden Chalet",
      slug: "garden-chalet",
      description:
        "Serene 45m² private chalet nestled within landscaped English gardens. Features high ceilings, private patio, and writing desk.",
      capacity: 2,
      maxAdults: 2,
      maxChildren: 0,
      bedArrangement: "1 Queen Bed or 2 Twins",
      basePrice: 195.0, // GBP
      amenities: ["Garden View", "Veranda", "Rainfall Shower", "Work Desk"],
    },
  });

  // 8. Create Physical Room Units (PMS Units)
  console.log("🚪 Seeding physical room units...");
  const room101 = await prisma.roomUnit.create({
    data: {
      propertyId: lodgeProperty.id,
      roomCategoryId: suiteCategory.id,
      name: "Room 101",
      floor: "1st Floor",
      status: RoomUnitStatus.VACANT_CLEAN,
      notes: "Turnover completed, minibar restocked, ready for arrival.",
    },
  });

  const room102 = await prisma.roomUnit.create({
    data: {
      propertyId: lodgeProperty.id,
      roomCategoryId: suiteCategory.id,
      name: "Room 102",
      floor: "1st Floor",
      status: RoomUnitStatus.OCCUPIED,
      notes: "Guest Eleanor Vance in residence.",
    },
  });

  const room103 = await prisma.roomUnit.create({
    data: {
      propertyId: lodgeProperty.id,
      roomCategoryId: suiteCategory.id,
      name: "Room 103",
      floor: "1st Floor",
      status: RoomUnitStatus.VACANT_DIRTY,
      notes:
        "Previous guest departed at 10:00. Linen change and sanitization in progress.",
    },
  });

  const room201 = await prisma.roomUnit.create({
    data: {
      propertyId: lodgeProperty.id,
      roomCategoryId: chaletCategory.id,
      name: "Room 201",
      floor: "Ground",
      status: RoomUnitStatus.VACANT_CLEAN,
      notes: "Inspected by Housekeeping Supervisor Sarah.",
    },
  });

  const room202 = await prisma.roomUnit.create({
    data: {
      propertyId: lodgeProperty.id,
      roomCategoryId: chaletCategory.id,
      name: "Room 202",
      floor: "Ground",
      status: RoomUnitStatus.MAINTENANCE,
      notes: "Air conditioner condenser filter replacement scheduled.",
    },
  });

  // 9. Create Rate Rules
  console.log("📈 Seeding rate rules & dynamic pricing...");
  await prisma.rateRule.create({
    data: {
      propertyId: lodgeProperty.id,
      roomCategoryId: suiteCategory.id,
      name: "Weekend Lakeside Surcharge",
      type: RateRuleType.WEEKDAY_WEEKEND,
      daysOfWeek: [5, 6], // Friday and Saturday
      priceMultiplier: 1.15, // +15%
      minStayDays: 2,
      restrictions: "2-night minimum stay on Friday/Saturday bookings.",
    },
  });

  // 10. Create Date Block (Enforces Maintenance Exclusion on Room 202)
  console.log("🔒 Seeding maintenance date block...");
  const blockStart = new Date();
  blockStart.setDate(blockStart.getDate() + 10);
  const blockEnd = new Date();
  blockEnd.setDate(blockEnd.getDate() + 14);

  await prisma.dateBlock.create({
    data: {
      propertyId: lodgeProperty.id,
      roomUnitId: room202.id,
      startDate: blockStart,
      endDate: blockEnd,
      reason: DateBlockReason.MAINTENANCE,
      notes: "Annual electrical inspection and A/C compressor overhaul.",
    },
  });

  // 11. Create Sample Reservation with AddOns, Payment, and Invoice
  console.log("📅 Seeding sample guest reservation...");
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + 3);
  const checkOut = new Date();
  checkOut.setDate(checkOut.getDate() + 6);

  const reservation = await prisma.reservation.create({
    data: {
      referenceCode: "RES-2026-8941",
      propertyId: lodgeProperty.id,
      roomCategoryId: suiteCategory.id,
      roomUnitId: room102.id,
      guestId: guestUser.id,
      status: ReservationStatus.UPCOMING,
      source: ReservationSource.ONLINE,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      adultsCount: 2,
      childrenCount: 0,
      specialRequests: "Anniversary stay. High floor, sunset lake view requested.",
      idVerificationStatus: IdVerificationStatus.VERIFIED,
      totalAmount: 905.0, // (285 * 3) + 50 add-ons
      currency: "GBP",
      addOns: {
        create: [
          {
            name: "Daily Full English Breakfast (2 Pax)",
            unitPrice: 25.0,
            quantity: 2,
            totalPrice: 50.0,
          },
          {
            name: "Sunset Boat Cruise on Lake Windermere",
            unitPrice: 45.0,
            quantity: 1,
            totalPrice: 45.0,
          },
        ],
      },
      payments: {
        create: [
          {
            amount: 905.0,
            currency: "GBP",
            method: PaymentMethod.CREDIT_CARD,
            status: PaymentStatus.COMPLETED,
            paymentType: PaymentType.FULL,
            transactionReference: "TXN-VISA-20261022-9914",
            paidAt: new Date(),
          },
        ],
      },
      invoices: {
        create: [
          {
            invoiceNumber: "INV-2026-0001",
            propertyId: lodgeProperty.id,
            subtotal: 820.0,
            taxAmount: 85.0, // 10% VAT
            totalAmount: 905.0,
            currency: "GBP",
            status: InvoiceStatus.PAID,
            paidAt: new Date(),
          },
        ],
      },
    },
  });

  // 12. Create Review with Owner Reply
  console.log("⭐ Seeding review & owner response...");
  await prisma.review.create({
    data: {
      reservationId: reservation.id,
      propertyId: lodgeProperty.id,
      guestId: guestUser.id,
      rating: 5,
      cleanliness: 5,
      staff: 5,
      location: 5,
      valueForMoney: 5,
      title: "Unmatched lakeside tranquility and warm hospitality",
      comment:
        "Windermere Lakeside Retreat exceeded every expectation. The Executive Suite overlooks crystal-clear waters, and the fine dining was sensational. We will be back!",
      ownerReply:
        "Thank you so much Eleanor! It was an absolute delight hosting your anniversary celebration at Windermere. Safe travels and see you soon!",
      repliedAt: new Date(),
    },
  });

  // 13. Create In-App Communication Message
  console.log("💬 Seeding guest-property messaging...");
  await prisma.message.create({
    data: {
      propertyId: lodgeProperty.id,
      reservationId: reservation.id,
      senderId: guestUser.id,
      recipientId: managerUser.id,
      subject: "Airport Transfer from Manchester Airport",
      content:
        "Hello Charlotte, could you please confirm if the shuttle will pick us up around 15:30 on arrival?",
      isRead: true,
    },
  });

  // 14. Create Commission Settings & Payouts
  console.log("💰 Seeding commission settings & payout history...");
  await prisma.commissionSetting.create({
    data: {
      propertyId: lodgeProperty.id,
      percentage: 10.0, // 10% platform fee
      payoutSchedule: PayoutSchedule.MONTHLY,
    },
  });

  const periodStart = new Date();
  periodStart.setDate(1);
  const periodEnd = new Date();

  await prisma.payout.create({
    data: {
      propertyId: lodgeProperty.id,
      payoutReference: "PO-2026-10-001",
      periodStart,
      periodEnd,
      grossRevenue: 48500.0,
      commissionRate: 10.0,
      commissionFee: 4850.0,
      netPayout: 43650.0,
      currency: "GBP",
      status: PayoutStatus.PAID,
      processedAt: new Date(),
      bankReference: "BACS-EFT-9923841",
    },
  });

  // 15. Create Audit Log Entry
  console.log("🛡️ Seeding platform audit log...");
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      userEmail: adminUser.email,
      action: "PROPERTY_APPROVED",
      entity: "Property",
      entityId: lodgeProperty.id,
      details:
        "Approved Windermere Lakeside Retreat & Lodge business registration (BR-2023-88941) and UTR (GB-UTR-2024-9842).",
    },
  });

  console.log("✅ Seed completed successfully!");
  console.log("=================================================================");
  console.log(
    "🔐 DEMO CREDENTIALS BY ROLE (Password for all: RoleName123456! / Staff123456!):"
  );
  console.log("1. ADMIN:       admin@sunbird.com       -> /admin");
  console.log("2. OWNER:       owner@lakehaven.com     -> /dashboard");
  console.log("3. MANAGER:     manager@lakehaven.com   -> /dashboard");
  console.log("4. FRONT_DESK:  reception@lakehaven.com -> /dashboard");
  console.log("5. HOUSEKEEPER: cleaner@lakehaven.com   -> /dashboard");
  console.log("6. GUEST:       guest@example.com       -> /account");
  console.log("=================================================================");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
