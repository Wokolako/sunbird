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
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSamDOzLsbWqYQ2rOwgUopBxxXejb4b_c6LEQ&s',
    price: 180,
    rating: 4.5,
    type: 'city',
  },
  {
    id: '2',
    name: 'Sunbird Capital',
    location: 'Lilongwe, Malawi',
    description: 'The leading hotel in the capital city, set in lush gardens and close to government offices.',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSwLg3B8V-ySHJl5mxvvQ_NQ6QBG8h2i15g6w&s',
    price: 210,
    rating: 4.7,
    type: 'city',
  },
  {
    id: '3',
    name: 'Sunbird Nkopola',
    location: 'Mangochi, Malawi',
    description: 'A beautiful lakeside resort on the shores of Lake Malawi, perfect for family vacations and water sports.',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQSDhU1XEw7BcDxYXM3ofT3Yw0VRAHmq0Nl9A&s',
    price: 150,
    rating: 4.8,
    type: 'resort',
  },
  {
    id: '4',
    name: 'Sunbird Livingstonia',
    location: 'Salima, Malawi',
    description: 'Experience the magic of the lake at this iconic resort, known for its pristine beaches and colonial charm.',
    image: 'https://picsum.photos/seed/livingstonia/800/600',
    price: 165,
    rating: 4.6,
    type: 'resort',
  },
  {
    id: '5',
    name: 'Sunbird Mzuzu',
    location: 'Mzuzu, Malawi',
    description: 'The gateway to the north, offering comfortable accommodations and excellent dining in Mzuzu.',
    image: 'https://picsum.photos/seed/mzuzu/800/600',
    price: 130,
    rating: 4.2,
    type: 'city',
  },
  {
    id: '6',
    name: 'Sunbird Ku Chawe',
    location: 'Zomba, Malawi',
    description: 'Perched on the edge of the Zomba Plateau, offering breathtaking views and cool mountain air.',
    image: 'https://picsum.photos/seed/kuchawe/800/600',
    price: 190,
    rating: 4.9,
    type: 'resort',
  },
];
