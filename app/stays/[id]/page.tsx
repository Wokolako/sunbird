import { RentalDetail } from "@/components/RentalDetail";
import { notFound } from "next/navigation";

export const metadata = { title: "Find your stay | Vabbot Resorts" };
export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const backend = (process.env.BACKEND_API_URL || "http://127.0.0.1:4000").replace(
    /\/$/,
    ""
  );
  let response: Response;
  try {
    response = await fetch(
      `${backend}/api/platform/properties/${encodeURIComponent(id)}`,
      {
        cache: "no-store",
      }
    );
  } catch {
    notFound();
  }
  if (!response.ok) notFound();
  const data = await response.json();
  return <RentalDetail property={data.property} />;
}
