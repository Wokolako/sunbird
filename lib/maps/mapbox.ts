export type GeocodingResult = {
  id: string;
  name: string;
  address: string;
  longitude: number;
  latitude: number;
};

export async function geocode(
  query: string,
  options: { country?: string; limit?: number } = {}
): Promise<GeocodingResult[]> {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) throw new Error("Mapbox is not configured.");
  const normalized = query.trim();
  if (normalized.length < 2 || normalized.length > 256)
    throw new Error("Enter a valid location.");
  const url = new URL("https://api.mapbox.com/search/geocode/v6/forward");
  url.searchParams.set("q", normalized);
  url.searchParams.set("access_token", token);
  url.searchParams.set("autocomplete", "false");
  url.searchParams.set("permanent", "true");
  url.searchParams.set("limit", String(Math.min(Math.max(options.limit || 5, 1), 10)));
  if (options.country) url.searchParams.set("country", options.country.toLowerCase());
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error("Location search is temporarily unavailable.");
  const data = (await response.json()) as {
    features?: Array<{
      id?: string;
      geometry?: { coordinates?: [number, number] };
      properties?: { name?: string; full_address?: string; place_formatted?: string };
    }>;
  };
  return (data.features || []).flatMap((feature) => {
    const coordinates = feature.geometry?.coordinates;
    if (!coordinates) return [];
    return [
      {
        id: feature.id || `${coordinates[0]},${coordinates[1]}`,
        name: feature.properties?.name || normalized,
        address:
          feature.properties?.full_address ||
          feature.properties?.place_formatted ||
          normalized,
        longitude: coordinates[0],
        latitude: coordinates[1],
      },
    ];
  });
}
