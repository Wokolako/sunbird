"use client";
/* Public catalogue contains only verified, published properties returned by the server. */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  MapPin,
  Search,
  CalendarDays,
  Users,
  Heart,
  Star,
  SlidersHorizontal,
  Map,
  List,
  ShieldCheck,
  Zap,
  MessageCircle,
  Waves,
  Trees,
  Building2,
  Mountain,
  Navigation,
  X,
  Check,
  BedDouble,
  Wifi,
  Coffee,
  Car,
  Accessibility,
  ChevronRight,
} from "lucide-react";
import { SiteHeader, SiteFooter } from "./SiteShell";

import { money, nightsBetween, type Stay } from "@/lib/stays";

function dateFromToday(offset: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

export function Marketplace({
  resultsPage = false,
  savedPage = false,
}: {
  resultsPage?: boolean;
  savedPage?: boolean;
}) {
  const [location, setLocation] = useState("");
  const [catalogue, setCatalogue] = useState<Stay[]>([]);
  const [userId, setUserId] = useState("");
  const [fetching, setFetching] = useState(true);
  const [start, setStart] = useState(() => dateFromToday(14));
  const [end, setEnd] = useState(() => dateFromToday(16));
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [ages, setAges] = useState<number[]>([]);
  const [rooms, setRooms] = useState(1);
  const [guestOpen, setGuestOpen] = useState(false);
  const [category, setCategory] = useState("All stays");
  const [sort, setSort] = useState("price_asc");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(3000000);
  const [accessible, setAccessible] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [instantOnly, setInstantOnly] = useState(false);
  const [cancellationOnly, setCancellationOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [activeStay, setActiveStay] = useState<Stay | null>(null);
  const [filters, setFilters] = useState(false);
  const [map, setMap] = useState(false);
  const [searched, setSearched] = useState(resultsPage || savedPage);
  const [saved, setSaved] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [fetchError, setFetchError] = useState("");
  const [catalogueRequest, setCatalogueRequest] = useState(0);
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const nights = nightsBetween(start, end);
  useEffect(() => {
    fetch("/api/backend/api/platform?view=session")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setUserId(d.user.id);
          try {
            setSaved(
              JSON.parse(localStorage.getItem(`vabbot-saved-${d.user.id}`) || "[]")
            );
          } catch {}
        }
      })
      .catch(() => {});
    const params = new URLSearchParams(window.location.search);
    if (params.get("location")) {
      setLocation(params.get("location")!);
      setSearched(true);
    }
    if (params.get("type")) {
      setCategory(params.get("type")!);
      setSearched(true);
    }
    if (params.get("start")) setStart(params.get("start")!);
    if (params.get("end")) setEnd(params.get("end")!);
    if (params.get("guests")) setAdults(Math.max(1, Number(params.get("guests")) || 2));
    if (params.get("rooms")) setRooms(Math.max(1, Number(params.get("rooms")) || 1));
    if (params.get("sort")) setSort(params.get("sort")!);
    if (params.get("page")) setPage(Math.max(1, Number(params.get("page")) || 1));
    if (params.get("pageSize")) setPageSize(Math.max(1, Number(params.get("pageSize")) || 6));
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setFetching(true);
    setFetchError("");
    const params = new URLSearchParams({
      view: "search",
      checkIn: start,
      checkOut: end,
      adults: String(adults),
      children: String(children),
      rooms: String(rooms),
    });
    fetch("/api/backend/api/platform?" + params, { signal: controller.signal })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw Error(data.error);
        return data;
      })
      .then((data) =>
        setCatalogue(
          data.results.map((p: Record<string, any>) => ({
            id: p.id,
            name: p.name,
            location: p.address,
            type:
              p.type === "short_term_let"
                ? "House"
                : p.type === "guesthouse"
                  ? "Guesthouse"
                  : p.type === "lodge"
                    ? "Lodge"
                    : "Hotel",
            price: Math.min(
              ...p.rooms.map((r: Record<string, any>) => r.nightly_rate_minor / 100)
            ),
            rating: 0,
            reviews: 0,
            image: p.photos[0] || "/assets/photo-1618773928121-c32242e63f39.jpg",
            images: p.photos.slice(1),
            amenities: p.amenities,
            instant: false,
            accessible: Boolean(p.accessibility),
            cancellation: false,
            distance: 0,
            capacity: Math.max(
              ...p.rooms.map(
                (r: Record<string, any>) => r.adult_capacity + r.child_capacity
              )
            ),
            rooms: p.rooms.reduce((n: number, r: Record<string, any>) => n + r.units, 0),
            lat: p.latitude,
            lng: p.longitude,
            description: p.description,
          }))
        )
      )
      .catch((e) => {
        if (e.name !== "AbortError")
          setFetchError(e.message || "We could not load available stays.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setFetching(false);
      });
    return () => controller.abort();
  }, [start, end, adults, children, rooms, catalogueRequest]);
  function save(id: string) {
    if (!userId) {
      window.location.href =
        "/account?next=" +
        encodeURIComponent(window.location.pathname + window.location.search);
      return;
    }

    const next = saved.includes(id) ? saved.filter((x) => x !== id) : [...saved, id];
    setSaved(next);
    try {
      localStorage.setItem(`vabbot-saved-${userId}`, JSON.stringify(next));
    } catch {
      setNotice("Saved for this visit. Browser storage is unavailable.");
    }
  }
  function nearMe() {
    if (!navigator.geolocation) {
      setNotice("Location is unavailable. Enter a destination instead.");
      return;
    }
    setNotice("Finding your location…");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setOrigin({ lat: p.coords.latitude, lng: p.coords.longitude });
        setLocation("");
        setSort("distance");
        setSearched(true);
        setNotice("Stays sorted by distance from your location.");
      },
      () => setNotice("Location access was declined. Enter a destination instead."),
      { timeout: 10000 }
    );
  }
  const distance = (s: Stay) => {
    if (!origin) return s.distance;
    const rad = Math.PI / 180;
    const a =
      Math.sin(((s.lat - origin.lat) * rad) / 2) ** 2 +
      Math.cos(origin.lat * rad) *
        Math.cos(s.lat * rad) *
        Math.sin(((s.lng - origin.lng) * rad) / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };
  const results = useMemo(() => {
    return catalogue
      .filter(
        (s) =>
          (!savedPage || saved.includes(s.id)) &&
          (!location ||
            `${s.location} ${s.name} Malawi UK England Keswick Windermere Lilongwe Blantyre`
              .toLowerCase()
              .includes(location.toLowerCase())) &&
          (category === "All stays" ||
            (category === "Lakeside"
              ? s.amenities.includes("Beachfront")
              : s.type === category)) &&
          s.price * nights * rooms >= minPrice &&
          s.price * nights * rooms <= maxPrice &&
          (!accessible || s.accessible) &&
          (selectedAmenities.length === 0 ||
            selectedAmenities.every((a) => s.amenities.includes(a))) &&
          (minRating === 0 || s.rating >= minRating) &&
          (!instantOnly || s.instant) &&
          (!cancellationOnly || s.cancellation) &&
          s.capacity * rooms >= adults + children &&
          s.rooms >= rooms
      )
      .sort((a, b) => {
        if (sort === "price" || sort === "price_asc") return a.price - b.price;
        if (sort === "price_desc") return b.price - a.price;
        if (sort === "rating") return b.rating - a.rating;
        if (sort === "distance") return distance(a) - distance(b);
        return a.name.localeCompare(b.name);
      });
  }, [
    catalogue,
    savedPage,
    saved,
    location,
    category,
    minPrice,
    maxPrice,
    nights,
    rooms,
    accessible,
    selectedAmenities,
    minRating,
    instantOnly,
    cancellationOnly,
    adults,
    children,
    sort,
    origin,
  ]);

  const validStays = results.filter(
    (s) => typeof s.lat === "number" && typeof s.lng === "number"
  );
  const mapBbox = useMemo(() => {
    if (validStays.length === 0) {
      return "-3.2%2C54.2%2C-2.7%2C54.7";
    }
    const lats = validStays.map((s) => s.lat);
    const lngs = validStays.map((s) => s.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const padLat = Math.max(0.02, (maxLat - minLat) * 0.2);
    const padLng = Math.max(0.02, (maxLng - minLng) * 0.2);
    return `${(minLng - padLng).toFixed(4)}%2C${(minLat - padLat).toFixed(4)}%2C${(maxLng + padLng).toFixed(4)}%2C${(maxLat + padLat).toFixed(4)}`;
  }, [validStays]);

  const totalResults = results.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedResults = results.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("page", String(newPage));
      url.searchParams.set("pageSize", String(pageSize));
      window.history.replaceState({}, "", url.toString());
    } catch {}
    document.getElementById("stays")?.scrollIntoView({ behavior: "smooth" });
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("page", "1");
      url.searchParams.set("pageSize", String(newSize));
      window.history.replaceState({}, "", url.toString());
    } catch {}
  };
  const stayLink = (s: Stay) =>
    `/stays/${s.id}?start=${start}&end=${end}&guests=${adults + children}&rooms=${rooms}`;
  const categories = [
    { name: "All stays", icon: BedDouble },
    { name: "Resort", icon: Waves },
    { name: "Lodge", icon: Trees },
    { name: "Hotel", icon: Building2 },
    { name: "Guesthouse", icon: Coffee },
    { name: "House", icon: Building2 },
  ];
  return (
    <div className="marketplace-page">
      <SiteHeader />
      <main>
        {!resultsPage && !savedPage && (
          <section className="escape-hero" aria-labelledby="guest-hero-title">
            <img
              className="hero-image"
              src="/assets/photo-1473116763249-2faaef81ccda.jpg"
              alt="Sunlight over a calm lake surrounded by mountains"
              fetchPriority="high"
            />
            <div className="hero-shade" />
            <div className="shell hero-content">
              <div className="hero-location">
                <MapPin size={14} /> Malawi, the warm heart of Africa
              </div>
              <h1 id="guest-hero-title">
                Somewhere special.
                <br />
                <em>Something unforgettable.</em>
              </h1>
              <p>
                From quiet lakeside mornings to a city worth exploring.
                <br className="desktop-break" /> Find hotels, lodges and a place that
                feels like you.
              </p>
              <a href="#stays" className="hero-explore">
                Find your kind of escape <ArrowDownIcon />
              </a>
            </div>
            <div className="hero-caption">
              <span>Less ordinary. More discovery.</span>
              <span>
                MALAWI <Waves size={16} />
              </span>
            </div>
          </section>
        )}
        <section
          className={`shell search-section ${resultsPage || savedPage ? "standalone-search" : ""}`}
        >
          {(resultsPage || savedPage) && (
            <div className="search-page-head">
              <h1>
                {savedPage ? "Your next escape, saved." : "Find your kind of stay."}
              </h1>
              <p>
                {savedPage
                  ? "A little collection of places you would love to be."
                  : "Explore hotels, lodges and guesthouses across Malawi."}
              </p>
            </div>
          )}
          <form
            className="search-bar"
            onSubmit={(e) => {
              e.preventDefault();
              setSearched(true);
              document.getElementById("stays")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <label className="search-field destination-field">
              <span>
                <MapPin size={17} /> Where to?
              </span>
              <input
                aria-label="Destination"
                placeholder="Anywhere in Malawi"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setOrigin(null);
                }}
                list="destinations-list"
              />
              <datalist id="destinations-list">
                {catalogue.map((s) => (
                  <option key={s.id} value={s.location} />
                ))}
              </datalist>
            </label>
            <label className="search-field">
              <span>
                <CalendarDays size={17} /> Check-in
              </span>
              <input
                aria-label="Check-in date"
                type="date"
                required
                min={new Date().toLocaleDateString("en-CA")}
                value={start}
                onChange={(e) => {
                  setStart(e.target.value);
                  if (end <= e.target.value) {
                    const d = new Date(e.target.value);
                    d.setUTCDate(d.getUTCDate() + 1);
                    setEnd(d.toISOString().slice(0, 10));
                  }
                }}
              />
            </label>
            <label className="search-field">
              <span>
                <CalendarDays size={17} /> Check-out
              </span>
              <input
                aria-label="Check-out date"
                type="date"
                required
                min={
                  Number.isFinite(Date.parse(start))
                    ? new Date(Date.parse(start) + 86400000).toISOString().slice(0, 10)
                    : undefined
                }
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </label>
            <div className="guest-field">
              <button
                className="search-field guest-trigger"
                type="button"
                aria-expanded={guestOpen}
                aria-controls="guest-room-picker"
                onClick={() => setGuestOpen(!guestOpen)}
              >
                <span>
                  <Users size={17} /> Guests & rooms
                </span>
                <strong>
                  {adults + children} guests · {rooms} room{rooms > 1 ? "s" : ""}
                </strong>
              </button>
              {guestOpen && (
                <div
                  className="guest-popover"
                  id="guest-room-picker"
                  role="group"
                  aria-label="Choose guests and rooms"
                  onKeyDown={(event) => {
                    if (event.key === "Escape") setGuestOpen(false);
                  }}
                >
                  <label>
                    Adults
                    <input
                      aria-label="Adults"
                      type="number"
                      min={1}
                      max={12}
                      value={adults}
                      onChange={(e) =>
                        setAdults(Math.max(1, Math.min(12, Number(e.target.value))))
                      }
                    />
                  </label>
                  <label>
                    Children
                    <input
                      aria-label="Children"
                      type="number"
                      min={0}
                      max={6}
                      value={children}
                      onChange={(e) => {
                        const n = Math.max(0, Math.min(6, Number(e.target.value)));
                        setChildren(n);
                        setAges(Array.from({ length: n }, (_, i) => ages[i] ?? 0));
                      }}
                    />
                  </label>
                  {ages.map((age, i) => (
                    <label key={i}>
                      Child {i + 1} age
                      <select
                        aria-label={`Child ${i + 1} age`}
                        value={age}
                        onChange={(e) =>
                          setAges(
                            ages.map((a, j) => (i === j ? Number(e.target.value) : a))
                          )
                        }
                      >
                        {Array.from({ length: 18 }, (_, n) => (
                          <option key={n}>{n}</option>
                        ))}
                      </select>
                    </label>
                  ))}
                  <label>
                    Rooms
                    <input
                      aria-label="Rooms"
                      type="number"
                      min={1}
                      max={6}
                      value={rooms}
                      onChange={(e) =>
                        setRooms(Math.max(1, Math.min(6, Number(e.target.value))))
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="button small"
                    onClick={() => setGuestOpen(false)}
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
            <button className="button search-submit">
              <Search size={19} /> Search stays
            </button>
          </form>
          <div className="search-under">
            <span>
              <ShieldCheck size={15} /> Thoughtful stays. Clear prices. Your kind of
              hospitality.
            </span>
            <button onClick={nearMe}>
              <Navigation size={14} /> Find stays near me
            </button>
          </div>
        </section>
        <section className="shell stays-section" id="stays">
          <div className="section-title">
            <div>
              <h2>
                {savedPage
                  ? "Places you love"
                  : searched
                    ? "Find a little more of your kind of place."
                    : "Good places. Great memories."}
              </h2>
              <p>
                {searched
                  ? `${results.length} stays · ${nights} nights · ${adults + children} guests · Published listings`
                  : "A few places to start your next story. Where will it be?"}
              </p>
            </div>
            <Link href="/search" className="text-link">
              Explore all stays <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="discovery-toolbar">
            <div className="category-tabs" aria-label="Property types">
              {categories.map(({ name, icon: Icon }) => (
                <button
                  key={name}
                  className={category === name ? "active" : ""}
                  onClick={() => {
                    setCategory(name);
                    setSearched(true);
                  }}
                  aria-pressed={category === name}
                >
                  <Icon size={18} />
                  {name === "Resort"
                    ? "Resorts"
                    : name === "Lodge"
                      ? "Lodges"
                      : name === "Hotel"
                        ? "Hotels"
                        : name === "Guesthouse"
                          ? "Guesthouses"
                          : name}
                </button>
              ))}
            </div>
            <div className="view-actions">
              <button
                className={filters ? "active" : ""}
                onClick={() => setFilters(!filters)}
                aria-expanded={filters}
              >
                <SlidersHorizontal size={16} />
                Filters
              </button>
              <button onClick={() => setMap(!map)} aria-pressed={map}>
                {map ? <List size={16} /> : <Map size={16} />}{" "}
                {map ? "List view" : "Map view"}
              </button>
            </div>
          </div>
          {filters && (
            <div
              className="filters-panel"
              style={{
                display: "grid",
                gap: 16,
                padding: "16px 20px",
                background: "#f8fafc",
                borderRadius: 8,
                border: "1px solid var(--market-line, #e2e8f0)",
                margin: "16px 0",
              }}
            >
              {/* Dual-ended price range */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 14,
                  alignItems: "end",
                }}
              >
                <label className="field">
                  <span>Min total: {money(minPrice)}</span>
                  <input
                    type="number"
                    min={0}
                    max={maxPrice}
                    step={1000}
                    value={minPrice}
                    onChange={(e) => {
                      setMinPrice(Math.max(0, Number(e.target.value)));
                      setPage(1);
                    }}
                    style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #cbd5e1" }}
                  />
                </label>
                <label className="field">
                  <span>Max total: {money(maxPrice)}</span>
                  <input
                    type="number"
                    min={minPrice}
                    max={5000000}
                    step={1000}
                    value={maxPrice}
                    onChange={(e) => {
                      setMaxPrice(Math.max(minPrice, Number(e.target.value)));
                      setPage(1);
                    }}
                    style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #cbd5e1" }}
                  />
                </label>
                <label className="field">
                  <span>Price slider ({money(maxPrice)})</span>
                  <input
                    type="range"
                    min={50000}
                    max={3000000}
                    step={10000}
                    value={maxPrice}
                    onChange={(e) => {
                      setMaxPrice(Number(e.target.value));
                      setPage(1);
                    }}
                  />
                </label>
              </div>

              {/* Guest / Star Rating Filter */}
              <div>
                <span style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Minimum guest rating:
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {[
                    { label: "Any rating", val: 0 },
                    { label: "★ 3.0+", val: 3 },
                    { label: "★ 4.0+", val: 4 },
                    { label: "★ 4.5+", val: 4.5 },
                  ].map((r) => (
                    <button
                      key={r.label}
                      type="button"
                      className={`button small ${minRating === r.val ? "" : "secondary"}`}
                      onClick={() => {
                        setMinRating(r.val);
                        setPage(1);
                      }}
                      style={{ padding: "4px 10px", fontSize: 12 }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Multi-Select Amenities Filter */}
              <div>
                <span style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Popular amenities:
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {[
                    "Wi-Fi",
                    "Pool",
                    "Breakfast",
                    "Beachfront",
                    "Parking",
                    "Air conditioning",
                    "Restaurant",
                    "Spa",
                    "Pet friendly",
                  ].map((a) => {
                    const isSelected = selectedAmenities.includes(a);
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => {
                          setSelectedAmenities((prev) =>
                            isSelected ? prev.filter((item) => item !== a) : [...prev, a]
                          );
                          setPage(1);
                        }}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 16,
                          fontSize: 12,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          background: isSelected ? "#0f766e" : "#ffffff",
                          color: isSelected ? "#ffffff" : "#1e293b",
                          border: isSelected ? "1px solid #0f766e" : "1px solid #cbd5e1",
                          fontWeight: isSelected ? 600 : 400,
                        }}
                      >
                        {isSelected && <Check size={12} />} {a}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Booking Options & Reset */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  paddingTop: 8,
                  borderTop: "1px solid #e2e8f0",
                }}
              >
                <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={accessible}
                      onChange={(e) => {
                        setAccessible(e.target.checked);
                        setPage(1);
                      }}
                    />
                    Accessible stays
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={instantOnly}
                      onChange={(e) => {
                        setInstantOnly(e.target.checked);
                        setPage(1);
                      }}
                    />
                    Instant booking only
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={cancellationOnly}
                      onChange={(e) => {
                        setCancellationOnly(e.target.checked);
                        setPage(1);
                      }}
                    />
                    Free cancellation
                  </label>
                </div>

                <button
                  type="button"
                  className="text-link"
                  onClick={() => {
                    setMinPrice(0);
                    setMaxPrice(3000000);
                    setAccessible(false);
                    setSelectedAmenities([]);
                    setMinRating(0);
                    setInstantOnly(false);
                    setCancellationOnly(false);
                    setCategory("All stays");
                    setPage(1);
                  }}
                  style={{ fontSize: 13 }}
                >
                  Reset all filters
                </button>
              </div>
            </div>
          )}
          {notice && (
            <p className="status" role="status">
              {notice}
            </p>
          )}
          <div className="results-meta">
            <span>Verified properties · Posted by accommodation providers</span>
            <label>
              Sort by{" "}
              <select
                aria-label="Sort stays"
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
              >
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
                <option value="rating">Top rated</option>
                <option value="distance">Distance: nearest</option>
                <option value="name">Property name: A to Z</option>
              </select>
            </label>
          </div>
          {fetching ? (
            <div
              className="stay-grid loading-grid"
              role="status"
              aria-label="Finding available stays"
            >
              {[0, 1, 2].map((item) => (
                <div className="stay-skeleton" key={item} aria-hidden="true">
                  <span />
                  <i />
                  <i />
                </div>
              ))}
              <span className="sr-only">Finding available stays...</span>
            </div>
          ) : fetchError ? (
            <div className="empty-state error-state" role="alert">
              <Search size={32} />
              <h3>We could not load stays.</h3>
              <p>{fetchError} Check your connection and try again.</p>
              <button
                className="button"
                onClick={() => setCatalogueRequest((value) => value + 1)}
              >
                Try again
              </button>
            </div>
          ) : results.length === 0 ? (
            <div className="empty-state">
              <Search size={32} />
              <h3>
                {savedPage
                  ? "Your collection starts here."
                  : "No published stays match yet."}
              </h3>
              <p>
                {savedPage
                  ? "Tap the heart on a stay to save it for later."
                  : "Try another destination, fewer rooms or a wider price range."}
              </p>
              <button
                className="button"
                onClick={() => {
                  if (savedPage) {
                    window.location.href = "/search";
                    return;
                  }
                  setLocation("");
                  setCategory("All stays");
                  setMinPrice(0);
                  setMaxPrice(3000000);
                  setAccessible(false);
                  setSelectedAmenities([]);
                  setMinRating(0);
                  setInstantOnly(false);
                  setCancellationOnly(false);
                  setAdults(2);
                  setChildren(0);
                  setAges([]);
                  setRooms(1);
                  setPage(1);
                }}
              >
                Explore stays
              </button>
            </div>
          ) : (
            <div className={map ? "map-results" : ""}>
              <div>
                <div className="stay-grid">
                  {paginatedResults.map((s) => (
                    <article
                      className="stay-card"
                      key={s.id}
                      style={{
                        outline: activeStay?.id === s.id ? "2px solid #0f766e" : undefined,
                        boxShadow: activeStay?.id === s.id ? "0 4px 16px rgba(15,118,110,0.2)" : undefined,
                      }}
                      onMouseEnter={() => {
                        if (map) setActiveStay(s);
                      }}
                    >
                      <div className="stay-image">
                        <Link href={stayLink(s)} tabIndex={-1} aria-hidden="true">
                          <img
                            src={s.image}
                            alt={`${s.name} accommodation setting`}
                            loading="lazy"
                          />
                        </Link>
                        <span className="photo-label">
                          {s.amenities.includes("Beachfront")
                            ? "Lakeside escape"
                            : s.type === "Lodge"
                              ? "Into the wild"
                              : "A lovely place to land"}
                        </span>
                        <button
                          className={`save-button ${saved.includes(s.id) ? "is-saved" : ""}`}
                          onClick={() => save(s.id)}
                          aria-label={`${saved.includes(s.id) ? "Unsave" : "Save"} ${s.name}`}
                          aria-pressed={saved.includes(s.id)}
                        >
                          <Heart
                            size={19}
                            fill={saved.includes(s.id) ? "currentColor" : "none"}
                          />
                        </button>
                      </div>
                      <div className="stay-topline">
                        <span>
                          {s.type} · {s.location}
                        </span>
                        <span className="rating">
                          {s.reviews > 0 ? (
                            <>
                              <Star size={13} fill="currentColor" /> {s.rating.toFixed(1)}{" "}
                              <small>({s.reviews})</small>
                            </>
                          ) : (
                            <small>New listing</small>
                          )}
                        </span>
                      </div>
                      <h3>
                        <Link href={stayLink(s)}>{s.name}</Link>
                      </h3>
                      <p className="stay-amenities">
                        {s.amenities.slice(0, 3).join(" · ")}
                      </p>
                      <div className="response-line">
                        <MessageCircle size={13} />
                        {s.instant ? "Instant booking" : "Request a stay"}
                        {origin && <span> · {distance(s).toFixed(1)} km</span>}
                      </div>
                      <div className="stay-bottom">
                        <div>
                          <strong>{money(s.price)}</strong>
                          <span> / night</span>
                          <small>
                            {money(s.price * nights * rooms)} total · {nights} nights · room
                            rate total
                          </small>
                        </div>
                        <Link href={stayLink(s)} aria-label={`View ${s.name}`}>
                          <ArrowUpRight size={21} />
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>

                {/* Production Pagination Controls */}
                {totalResults > 0 && (
                  <div
                    className="marketplace-pagination"
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                      marginTop: 32,
                      paddingTop: 24,
                      borderTop: "1px solid var(--market-line, #e2e8f0)",
                    }}
                  >
                    <div style={{ fontSize: 13, color: "var(--market-muted, #64748b)" }}>
                      Showing <strong>{Math.min(startIndex + 1, totalResults)}</strong>–
                      <strong>{Math.min(startIndex + pageSize, totalResults)}</strong> of{" "}
                      <strong>{totalResults}</strong> stays
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <button
                        type="button"
                        className="button secondary small"
                        disabled={currentPage <= 1}
                        onClick={() => handlePageChange(1)}
                        aria-label="First page"
                        title="First page"
                        style={{ minWidth: 36, padding: "6px 8px" }}
                      >
                        «
                      </button>
                      <button
                        type="button"
                        className="button secondary small"
                        disabled={currentPage <= 1}
                        onClick={() => handlePageChange(currentPage - 1)}
                        aria-label="Previous page"
                        title="Previous page"
                        style={{ minWidth: 36, padding: "6px 8px" }}
                      >
                        ‹
                      </button>

                      {getPageNumbers(currentPage, totalPages).map((p, idx) =>
                        p === "..." ? (
                          <span key={`ellipsis-${idx}`} style={{ padding: "0 6px", color: "#94a3b8" }}>
                            …
                          </span>
                        ) : (
                          <button
                            key={`page-${p}`}
                            type="button"
                            className={`button small ${currentPage === p ? "" : "secondary"}`}
                            onClick={() => handlePageChange(Number(p))}
                            aria-current={currentPage === p ? "page" : undefined}
                            style={{
                              minWidth: 36,
                              padding: "6px 10px",
                              fontWeight: currentPage === p ? 700 : 500,
                            }}
                          >
                            {p}
                          </button>
                        )
                      )}

                      <button
                        type="button"
                        className="button secondary small"
                        disabled={currentPage >= totalPages}
                        onClick={() => handlePageChange(currentPage + 1)}
                        aria-label="Next page"
                        title="Next page"
                        style={{ minWidth: 36, padding: "6px 8px" }}
                      >
                        ›
                      </button>
                      <button
                        type="button"
                        className="button secondary small"
                        disabled={currentPage >= totalPages}
                        onClick={() => handlePageChange(totalPages)}
                        aria-label="Last page"
                        title="Last page"
                        style={{ minWidth: 36, padding: "6px 8px" }}
                      >
                        »
                      </button>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                      <span style={{ color: "var(--market-muted, #64748b)" }}>Stays per page:</span>
                      <select
                        value={pageSize}
                        onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                        aria-label="Stays per page"
                        style={{
                          padding: "4px 8px",
                          borderRadius: 6,
                          border: "1px solid var(--market-line, #cbd5e1)",
                          fontSize: 13,
                        }}
                      >
                        <option value={6}>6 per page</option>
                        <option value={12}>12 per page</option>
                        <option value={24}>24 per page</option>
                        <option value={48}>48 per page</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {map && (
                <aside
                  className="map-panel"
                  style={{
                    position: "sticky",
                    top: 20,
                    borderRadius: 12,
                    border: "1px solid var(--market-line, #cbd5e1)",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    background: "#f8fafc",
                    minHeight: 580,
                  }}
                >
                  {/* Map Header & Jump Chips */}
                  <div
                    style={{
                      padding: "10px 14px",
                      background: "#ffffff",
                      borderBottom: "1px solid #e2e8f0",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                        <MapPin size={15} color="#0f766e" />
                        Map Search ({results.length} stay{results.length === 1 ? "" : "s"})
                      </strong>
                      <span style={{ fontSize: 11, color: "#64748b" }}>Live interactive view</span>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: "#64748b" }}>Jump to:</span>
                      {[
                        { label: "All Areas", query: "" },
                        { label: "Lake Malawi", query: "Mangochi" },
                        { label: "Lilongwe", query: "Lilongwe" },
                        { label: "Windermere", query: "Windermere" },
                        { label: "Blantyre", query: "Blantyre" },
                      ].map((chip) => (
                        <button
                          key={chip.label}
                          type="button"
                          className={`button small ${location.toLowerCase() === chip.query.toLowerCase() ? "" : "secondary"}`}
                          style={{ padding: "2px 8px", fontSize: 11, borderRadius: 12 }}
                          onClick={() => {
                            setLocation(chip.query);
                            setPage(1);
                          }}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Interactive Map Embed */}
                  <div style={{ flex: 1, minHeight: 380, position: "relative" }}>
                    <iframe
                      title="Marketplace interactive accommodation map"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapBbox}&layer=mapnik`}
                      style={{ width: "100%", height: "100%", border: "none", display: "block" }}
                      loading="lazy"
                    />

                    {/* Stay Preview Popover (when a stay is selected/clicked) */}
                    {activeStay && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: 14,
                          left: 14,
                          right: 14,
                          background: "#ffffff",
                          borderRadius: 10,
                          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                          padding: 10,
                          display: "flex",
                          gap: 12,
                          alignItems: "center",
                          zIndex: 20,
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        <img
                          src={activeStay.image}
                          alt={activeStay.name}
                          style={{
                            width: 80,
                            height: 64,
                            borderRadius: 6,
                            objectFit: "cover",
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                            <h4
                              style={{
                                margin: 0,
                                fontSize: 13,
                                fontWeight: 700,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {activeStay.name}
                            </h4>
                            <button
                              type="button"
                              onClick={() => setActiveStay(null)}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: 2,
                                color: "#94a3b8",
                              }}
                              aria-label="Close preview"
                            >
                              <X size={14} />
                            </button>
                          </div>
                          <div style={{ fontSize: 11, color: "#64748b", margin: "2px 0 4px" }}>
                            {activeStay.location} · {activeStay.type}
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <strong style={{ fontSize: 13, color: "#0f766e" }}>
                              {money(activeStay.price)} <span style={{ fontSize: 10, fontWeight: 400, color: "#64748b" }}>/ night</span>
                            </strong>
                            <Link
                              href={stayLink(activeStay)}
                              className="button small"
                              style={{ padding: "2px 8px", fontSize: 11 }}
                            >
                              View stay
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Interactive Stay Pins Drawer */}
                  <div
                    style={{
                      padding: "10px 14px",
                      background: "#ffffff",
                      borderTop: "1px solid #e2e8f0",
                      maxHeight: 160,
                      overflowY: "auto",
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>
                      CLICK PIN TO PREVIEW STAY:
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {results.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setActiveStay(s)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "4px 8px",
                            borderRadius: 16,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                            background: activeStay?.id === s.id ? "#0f766e" : "#f1f5f9",
                            color: activeStay?.id === s.id ? "#ffffff" : "#1e293b",
                            border: "1px solid",
                            borderColor: activeStay?.id === s.id ? "#0f766e" : "#cbd5e1",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <MapPin size={11} />
                          {money(s.price)} · {s.name.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                </aside>
              )}
            </div>
          )}
        </section>
        {!savedPage && (
          <>
            <section className="shell destination-section" id="destinations">
              <div className="section-title">
                <div>
                  <h2>Let the destination find you.</h2>
                  <p>Different corners. The same warm welcome.</p>
                </div>
                <span className="destination-note">
                  A whole country to discover <ArrowRight size={18} />
                </span>
              </div>
              <div className="destination-grid">
                {[
                  {
                    name: "Lake Malawi",
                    query: "Mangochi",
                    desc: "Lakeside mornings, mountain days",
                    img: "photo-1473116763249-2faaef81ccda",
                  },
                  {
                    name: "Lilongwe",
                    query: "Lilongwe",
                    desc: "A city with a softer side",
                    img: "photo-1566073771259-6a8506099945",
                  },
                  {
                    name: "Zomba Plateau",
                    query: "Zomba",
                    desc: "A breath of something different",
                    img: "photo-1449158743715-0a90ebb6d2d8",
                  },
                ].map((d) => (
                  <Link
                    key={d.name}
                    href={`/search?location=${encodeURIComponent(d.query)}`}
                    className="destination-card"
                  >
                    <img src={`/assets/${d.img}.jpg`} alt={d.name} loading="lazy" />
                    <div>
                      <h3>{d.name}</h3>
                      <p>{d.desc}</p>
                    </div>
                    <ArrowUpRight size={24} />
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
function ArrowDownIcon() {
  return <ChevronRight size={16} style={{ transform: "rotate(90deg)" }} />;
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, "...", total];
  }
  if (current >= total - 3) {
    return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, "...", current - 1, current, current + 1, "...", total];
}
