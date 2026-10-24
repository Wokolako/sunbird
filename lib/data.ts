export interface Hotel {
  id: string;
  name: string;
  location: string;
  description: string;
  image: string;
  price: number;
  rating: number;
  type: "city" | "resort";
}

export const hotels: Hotel[] = [
  {
    id: "1",
    name: "Vabbot Kensington",
    location: "London, United Kingdom",
    description:
      "A premier boutique hotel located in the heart of Kensington, offering panoramic views of Hyde Park.",
    image:
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=800&auto=format&fit=crop",
    price: 280,
    rating: 4.5,
    type: "city",
  },
  {
    id: "2",
    name: "Vabbot Westminster",
    location: "London, United Kingdom",
    description:
      "The leading hotel in the heart of Westminster, set in elegant gardens and close to Buckingham Palace.",
    image:
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=800&auto=format&fit=crop",
    price: 310,
    rating: 4.7,
    type: "city",
  },
  {
    id: "3",
    name: "Vabbot Windermere",
    location: "Lake District, United Kingdom",
    description:
      "A beautiful lakeside resort on the shores of Lake Windermere, perfect for family holidays and countryside walks.",
    image:
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=800&auto=format&fit=crop",
    price: 220,
    rating: 4.8,
    type: "resort",
  },
  {
    id: "4",
    name: "Vabbot Cotswolds",
    location: "Cotswolds, United Kingdom",
    description:
      "Experience the magic of the English countryside at this iconic resort, known for its rolling hills and honey-stone charm.",
    image:
      "https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=800&auto=format&fit=crop",
    price: 265,
    rating: 4.6,
    type: "resort",
  },
  {
    id: "5",
    name: "Vabbot Edinburgh",
    location: "Edinburgh, United Kingdom",
    description:
      "The gateway to Scotland, offering luxurious accommodations and fine dining in Edinburgh's historic Old Town.",
    image:
      "https://images.unsplash.com/photo-1566195992011-5f6b21e539aa?q=80&w=800&auto=format&fit=crop",
    price: 230,
    rating: 4.2,
    type: "city",
  },
  {
    id: "6",
    name: "Vabbot Highlands Lodge",
    location: "Scottish Highlands, United Kingdom",
    description:
      "Perched on the edge of the Scottish Highlands, offering breathtaking mountain views and cool highland air.",
    image:
      "https://images.unsplash.com/photo-1590490359683-658d3d23f972?q=80&w=800&auto=format&fit=crop",
    price: 290,
    rating: 4.9,
    type: "resort",
  },
];
