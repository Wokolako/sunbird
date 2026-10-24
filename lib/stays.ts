export type Stay = {
  id: string;
  name: string;
  location: string;
  type: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  images: string[];
  amenities: string[];
  instant: boolean;
  accessible: boolean;
  cancellation: boolean;
  distance: number;
  capacity: number;
  rooms: number;
  lat: number;
  lng: number;
  description: string;
};
const photo = (id: string) => `/assets/${id}.jpg`;
export const stays: Stay[] = [
  {
    id: "windermere",
    name: "Windermere Lakeside Retreat",
    location: "Lake District",
    type: "Resort",
    price: 285,
    rating: 4.9,
    reviews: 128,
    image: photo("photo-1571896349842-33c89424de2d"),
    images: [
      photo("photo-1611892440504-42a792e24d32"),
      photo("photo-1540541338287-41700207dee6"),
    ],
    amenities: ["Wi-Fi", "Pool", "Breakfast", "Lakeside"],
    instant: true,
    accessible: true,
    cancellation: true,
    distance: 2.4,
    capacity: 4,
    rooms: 4,
    lat: 54.38,
    lng: -2.94,
    description:
      "Slow mornings, open water and a little more room to breathe. Settle into a lakeside suite, enjoy breakfast on the terrace and spend the afternoon by the pool.",
  },
  {
    id: "cotswolds",
    name: "Cotswolds Manor Lodge",
    location: "Cotswolds",
    type: "Lodge",
    price: 245,
    rating: 4.8,
    reviews: 86,
    image: photo("photo-1449158743715-0a90ebb6d2d8"),
    images: [
      photo("photo-1445019980597-93fa8acb246c"),
      photo("photo-1611892440504-42a792e24d32"),
    ],
    amenities: ["Wi-Fi", "Breakfast", "Parking"],
    instant: false,
    accessible: false,
    cancellation: true,
    distance: 7.1,
    capacity: 2,
    rooms: 2,
    lat: 51.83,
    lng: -1.68,
    description:
      "A quiet countryside escape with honey-stone verandas and trails on your doorstep. Unplug, listen to the birds and make yourself at home in a comfortable country lodge.",
  },
  {
    id: "kensington",
    name: "The Kensington House",
    location: "London",
    type: "Hotel",
    price: 195,
    rating: 4.7,
    reviews: 204,
    image: photo("photo-1566073771259-6a8506099945"),
    images: [
      photo("photo-1618773928121-c32242e63f39"),
      photo("photo-1611892440504-42a792e24d32"),
    ],
    amenities: ["Wi-Fi", "Pool", "Parking", "Breakfast"],
    instant: true,
    accessible: true,
    cancellation: true,
    distance: 1.8,
    capacity: 3,
    rooms: 6,
    lat: 51.502,
    lng: -0.193,
    description:
      "An easy city base with a leafy garden, comfortable rooms and a welcoming restaurant. Well placed for meetings, a city stopover or the beginning of a UK adventure.",
  },
  {
    id: "bath",
    name: "Bath Royal Hideaway",
    location: "Bath",
    type: "Guesthouse",
    price: 175,
    rating: 4.6,
    reviews: 52,
    image: photo("photo-1540541338287-41700207dee6"),
    images: [
      photo("photo-1618773928121-c32242e63f39"),
      photo("photo-1571896349842-33c89424de2d"),
    ],
    amenities: ["Wi-Fi", "Spa", "Parking"],
    instant: true,
    accessible: false,
    cancellation: false,
    distance: 5.3,
    capacity: 4,
    rooms: 3,
    lat: 51.381,
    lng: -2.359,
    description:
      "Georgian elegance by the Roman Baths, bright rooms and space for the whole family. A relaxed guesthouse for travellers who like to take life at their own pace.",
  },
  {
    id: "highlands",
    name: "Highland Glen Lodge",
    location: "Scottish Highlands",
    type: "Lodge",
    price: 265,
    rating: 4.8,
    reviews: 73,
    image: photo("photo-1445019980597-93fa8acb246c"),
    images: [
      photo("photo-1449158743715-0a90ebb6d2d8"),
      photo("photo-1611892440504-42a792e24d32"),
    ],
    amenities: ["Wi-Fi", "Breakfast", "Parking"],
    instant: false,
    accessible: false,
    cancellation: true,
    distance: 8.2,
    capacity: 3,
    rooms: 4,
    lat: 57.48,
    lng: -5.0,
    description:
      "Wake to mountain views and spend your days exploring the glens. Spacious lodges offer a peaceful base for walking, reading and time together.",
  },
  {
    id: "edinburgh",
    name: "Edinburgh Royal Hotel",
    location: "Edinburgh",
    type: "Hotel",
    price: 225,
    rating: 4.7,
    reviews: 112,
    image: photo("photo-1582719478250-c89cae4dc85b"),
    images: [
      photo("photo-1618773928121-c32242e63f39"),
      photo("photo-1566073771259-6a8506099945"),
    ],
    amenities: ["Wi-Fi", "Pool", "Breakfast", "Parking"],
    instant: true,
    accessible: true,
    cancellation: true,
    distance: 3.6,
    capacity: 4,
    rooms: 5,
    lat: 55.953,
    lng: -3.189,
    description:
      "A Georgian gem in the heart of Edinburgh, with elegant rooms and a rooftop bar. Stay close to the Royal Mile while enjoying a calm place to return to.",
  },
];
export const money = (amount: number) =>
  `£${new Intl.NumberFormat("en-GB").format(amount)}`;
export function nightsBetween(start: string, end: string) {
  const count = Math.round((Date.parse(end) - Date.parse(start)) / 86400000);
  return Number.isFinite(count) ? Math.max(1, count) : 1;
}
export type BookingPreview = {
  id: string;
  stayId: string;
  start: string;
  end: string;
  guests: number;
  rooms: number;
  total: number;
  name: string;
  status: string;
  created: string;
  refundable: boolean;
  room: string;
  rate: string;
};
