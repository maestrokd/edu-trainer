export interface PictureItem {
  id: string;
  name: string; // The word to be spoken
  imageUrl: string;
  category: string;
}

export const DEFAULT_PICTURE_LIBRARY: PictureItem[] = [
  {
    id: "apple",
    name: "Apple",
    imageUrl: "https://images.unsplash.com/photo-1560806887-1e4cd0b6bcd6?w=400&h=400&fit=crop",
    category: "Fruit",
  },
  {
    id: "banana",
    name: "Banana",
    imageUrl: "https://images.unsplash.com/photo-1571771894821-ad996211fdf4?w=400&h=400&fit=crop",
    category: "Fruit",
  },
  {
    id: "cherry",
    name: "Cherry",
    imageUrl: "https://images.unsplash.com/photo-1528825871115-3581a5387919?w=400&h=400&fit=crop",
    category: "Fruit",
  },
  {
    id: "dog",
    name: "Dog",
    imageUrl: "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400&h=400&fit=crop",
    category: "Animal",
  },
  {
    id: "cat",
    name: "Cat",
    imageUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop",
    category: "Animal",
  },
  {
    id: "rabbit",
    name: "Rabbit",
    imageUrl: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400&h=400&fit=crop",
    category: "Animal",
  },
  {
    id: "car",
    name: "Car",
    imageUrl: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=400&fit=crop",
    category: "Vehicle",
  },
  {
    id: "plane",
    name: "Plane",
    imageUrl: "https://images.unsplash.com/photo-1436491865332-7a61a109c0f2?w=400&h=400&fit=crop",
    category: "Vehicle",
  },
  {
    id: "bike",
    name: "Bike",
    imageUrl: "https://images.unsplash.com/photo-1485965120184-e220f12128b4?w=400&h=400&fit=crop",
    category: "Vehicle",
  },
  {
    id: "sun",
    name: "Sun",
    imageUrl: "https://images.unsplash.com/photo-1534840693216-ad938531333a?w=400&h=400&fit=crop",
    category: "Nature",
  },
  {
    id: "moon",
    name: "Moon",
    imageUrl: "https://images.unsplash.com/photo-1532767153582-b1a0e5145009?w=400&h=400&fit=crop",
    category: "Nature",
  },
  {
    id: "flower",
    name: "Flower",
    imageUrl: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=400&fit=crop",
    category: "Nature",
  },
];

export interface PictureChooseExercise {
  target: PictureItem;
  options: PictureItem[];
}

export function generateExercise(library: PictureItem[]): PictureChooseExercise | null {
  if (library.length < 3) return null;

  const targetIndex = Math.floor(Math.random() * library.length);
  const target = library[targetIndex];

  const shuffled = [...library].sort(() => Math.random() - 0.5);
  const distractors = shuffled.filter((item) => item.id !== target.id).slice(0, 2);

  const options = [target, ...distractors].sort(() => Math.random() - 0.5);

  return { target, options };
}
