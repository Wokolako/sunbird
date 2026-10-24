import { notFound } from "next/navigation";
import { RentalDetail } from "@/components/RentalDetail";
import { database, currentUser } from "@/lib/platform";
export const metadata = { title: "Find your stay | Vabbot Resorts" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = database();
  const p = db
    .prepare(
      "SELECT p.* FROM properties p JOIN organisations o ON o.id=p.organisation_id JOIN users u ON u.id=o.owner_id WHERE p.id=? AND p.status='published' AND o.status='approved' AND u.status='active'"
    )
    .get(id);
  if (!p) notFound();
  const rooms = db.prepare("SELECT * FROM rooms WHERE property_id=?").all(id);
  const user = await currentUser();
  return (
    <RentalDetail
      property={{
        ...p,
        photos: JSON.parse(p.photos),
        amenities: JSON.parse(p.amenities),
        rooms,
      }}
      user={user ? { id: user.id, name: user.name } : null}
    />
  );
}
