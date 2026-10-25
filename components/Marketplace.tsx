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
  const [start, setStart] = useState("2026-11-06");
  const [end, setEnd] = useState("2026-11-08");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [ages, setAges] = useState<number[]>([]);
  const [rooms, setRooms] = useState(1);
  const [guestOpen, setGuestOpen] = useState(false);
  const [category, setCategory] = useState("All stays");
  const [sort, setSort] = useState("recommended");
  const [maxPrice, setMaxPrice] = useState(1500000);
  const [rating, setRating] = useState(false);
  const [instant, setInstant] = useState(false);
  const [accessible, setAccessible] = useState(false);
  const [cancel, setCancel] = useState(false);
  const [amenity, setAmenity] = useState("");
  const [filters, setFilters] = useState(false);
  const [map, setMap] = useState(false);
  const [searched, setSearched] = useState(resultsPage || savedPage);
  const [saved, setSaved] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const nights = nightsBetween(start, end);
  useEffect(() => {
    fetch("/api/platform?view=session")
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
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setFetching(true);
    const params = new URLSearchParams({
      view: "search",
      checkIn: start,
      checkOut: end,
      adults: String(adults),
      children: String(children),
      rooms: String(rooms),
    });
    fetch("/api/platform?" + params, { signal: controller.signal })
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
          setNotice(e.message || "Could not load stays. Please reload.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setFetching(false);
      });
    return () => controller.abort();
  }, [start, end, adults, children, rooms]);
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
  const results = catalogue
    .filter(
      (s) =>
        (!savedPage || saved.includes(s.id)) &&
        (!location ||
          `${s.location} ${s.name} Malawi`
            .toLowerCase()
            .includes(location.toLowerCase())) &&
        (category === "All stays" ||
          (category === "Lakeside"
            ? s.amenities.includes("Beachfront")
            : s.type === category)) &&
        s.price * nights * rooms <= maxPrice &&
        (!rating || s.rating >= 4.8) &&
        (!instant || s.instant) &&
        (!accessible || s.accessible) &&
        (!cancel || s.cancellation) &&
        (!amenity || s.amenities.includes(amenity)) &&
        s.capacity * rooms >= adults + children &&
        s.rooms >= rooms
    )
    .sort((a, b) =>
      sort === "price"
        ? a.price - b.price
        : sort === "rating"
          ? b.rating - a.rating
          : sort === "distance"
            ? distance(a) - distance(b)
            : b.rating - a.rating
    );
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
          <section className="escape-hero">
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
              <h1>
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
                  : "Explore hotels, lodges and guesthouses across the Malawi."}
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
                <div className="guest-popover">
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
            <div className="filters-panel">
              <label className="field">
                Maximum total: {money(maxPrice)}
                <input
                  type="range"
                  min={50000}
                  max={3000000}
                  step={10000}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                />
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={rating}
                  onChange={(e) => setRating(e.target.checked)}
                />{" "}
                Rating 4.8+
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={instant}
                  onChange={(e) => setInstant(e.target.checked)}
                />{" "}
                Instant booking
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={cancel}
                  onChange={(e) => setCancel(e.target.checked)}
                />{" "}
                Free cancellation
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={accessible}
                  onChange={(e) => setAccessible(e.target.checked)}
                />{" "}
                Accessible stays
              </label>
              <label className="field">
                Amenities
                <select value={amenity} onChange={(e) => setAmenity(e.target.value)}>
                  <option value="">All amenities</option>
                  {["Wi-Fi", "Pool", "Breakfast", "Beachfront", "Parking"].map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
              </label>
              <button
                className="text-link"
                onClick={() => {
                  setMaxPrice(1500000);
                  setRating(false);
                  setInstant(false);
                  setCancel(false);
                  setAccessible(false);
                  setAmenity("");
                  setCategory("All stays");
                }}
              >
                Reset filters
              </button>
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
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="recommended">Recommended</option>
                <option value="price">Price: low to high</option>
                <option value="distance">Distance</option>
                <option value="rating">Guest rating</option>
              </select>
            </label>
          </div>
          {fetching ? (
            <p role="status">Finding available stays...</p>
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
                  setMaxPrice(3000000);
                  setRating(false);
                  setInstant(false);
                  setAccessible(false);
                  setCancel(false);
                  setAmenity("");
                  setAdults(2);
                  setChildren(0);
                  setAges([]);
                  setRooms(1);
                }}
              >
                Explore stays
              </button>
            </div>
          ) : (
            <div className={map ? "map-results" : ""}>
              <div className="stay-grid">
                {results.map((s) => (
                  <article className="stay-card" key={s.id}>
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
              {map && (
                <aside className="map-panel">
                  <div className="map-lake">UNITED KINGDOM</div>
                  <strong className="map-label">UK · location overview</strong>
                  {results.map((s, i) => (
                    <Link
                      key={s.id}
                      className="map-pin"
                      style={{
                        left: `${18 + (i % 3) * 25}%`,
                        top: `${22 + Math.floor(i / 3) * 37 + (i % 2) * 12}%`,
                      }}
                      href={stayLink(s)}
                    >
                      <MapPin size={13} />
                      {money(s.price)}
                      <small>{s.location}</small>
                    </Link>
                  ))}
                  <p>Approximate overview. Open a stay for its map link.</p>
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
