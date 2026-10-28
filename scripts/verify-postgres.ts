import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [users, organisations, properties, rooms, roomUnits, reservations, documents, ratePlans, tasks] =
    await prisma.$transaction([
      prisma.user.count(),
      prisma.organisation.count(),
      prisma.property.count(),
      prisma.roomCategory.count(),
      prisma.roomUnit.count(),
      prisma.reservation.count(),
      prisma.verificationDocument.count(),
      prisma.ratePlan.count(),
      prisma.operationalTask.count(),
    ]);
  const orphanProperties = await prisma.property.count({
    where: { organisationId: null },
  });
  const invalidReservations = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count FROM "Reservation"
    WHERE "checkOutDate" <= "checkInDate" OR "totalAmount" < 0
  `;
  const roomsWithoutUnits = await prisma.roomCategory.count({ where: { roomUnits: { none: {} } } });
  const result = {
    users,
    organisations,
    properties,
    rooms,
    roomUnits,
    reservations,
    documents,
    ratePlans,
    tasks,
    orphanProperties,
    invalidReservations: Number(invalidReservations[0]?.count || 0),
    roomsWithoutUnits,
  };
  console.table(result);
  if (orphanProperties || result.invalidReservations || roomsWithoutUnits)
    throw new Error("PostgreSQL verification found invalid production records.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
