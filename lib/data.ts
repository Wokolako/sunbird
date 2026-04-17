export interface Hotel {
  id: string;
  name: string;
  location: string;
  description: string;
  image: string;
  price: number;
  rating: number;
  type: 'city' | 'resort';
}

export const hotels: Hotel[] = [
  {
    id: '1',
    name: 'Sunbird Mount Soche',
    location: 'Blantyre, Malawi',
    description: 'A premier business hotel located in the heart of Blantyre, offering panoramic views of the city.',
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=800&auto=format&fit=crop',
    price: 180,
    rating: 4.5,
    type: 'city',
  },
  {
    id: '2',
    name: 'Sunbird Capital',
    location: 'Lilongwe, Malawi',
    description: 'The leading hotel in the capital city, set in lush gardens and close to government offices.',
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=800&auto=format&fit=crop',
    price: 210,
    rating: 4.7,
    type: 'city',
  },
  {
    id: '3',
    name: 'Sunbird Nkopola',
    location: 'Mangochi, Malawi',
    description: 'A beautiful lakeside resort on the shores of Lake Malawi, perfect for family vacations and water sports.',
    image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=800&auto=format&fit=crop',
    price: 150,
    rating: 4.8,
    type: 'resort',
  },
  {
    id: '4',
    name: 'Sunbird Livingstonia',
    location: 'Salima, Malawi',
    description: 'Experience the magic of the lake at this iconic resort, known for its pristine beaches and colonial charm.',
    image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=800&auto=format&fit=crop',
    price: 165,
    rating: 4.6,
    type: 'resort',
  },
  {
    id: '5',
    name: 'Sunbird Mzuzu',
    location: 'Mzuzu, Malawi',
    description: 'The gateway to the north, offering comfortable accommodations and excellent dining in Mzuzu.',
    image: 'https://images.unsplash.com/photo-1566195992011-5f6b21e539aa?q=80&w=800&auto=format&fit=crop',
    price: 130,
    rating: 4.2,
    type: 'city',
  },
  {
    id: '6',
    name: 'Sunbird Ku Chawe',
    location: 'Zomba, Malawi',
    description: 'Perched on the edge of the Zomba Plateau, offering breathtaking views and cool mountain air.',
    image: 'https://images.unsplash.com/photo-1590490359683-658d3d23f972?q=80&w=800&auto=format&fit=crop',
    price: 190,
    rating: 4.9,
    type: 'resort',
  },
];
