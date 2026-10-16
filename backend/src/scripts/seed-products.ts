import { productsService, type CreateProductInput } from '../modules/products/index.js';

export interface SampleProduct extends CreateProductInput {
  daysAgo: number;
}

export interface ProductSeedResult {
  inserted: number;
  skipped: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const image = (slug: string): string => `https://picsum.photos/seed/${slug}/600/400`;

export const SAMPLE_PRODUCTS: readonly SampleProduct[] = [
  {
    title: 'Wireless Mouse',
    description: 'Ergonomic 2.4 GHz wireless mouse with a silent click and USB receiver.',
    price: 24.99,
    category: 'Electronics',
    images: [image('wireless-mouse')],
    stock: 120,
    daysAgo: 1,
  },
  {
    title: 'Mechanical Keyboard',
    description: 'Compact 87-key mechanical keyboard with hot-swappable switches.',
    price: 89.5,
    category: 'Electronics',
    images: [image('mechanical-keyboard'), image('mechanical-keyboard-2')],
    stock: 45,
    daysAgo: 6,
  },
  {
    title: '27" 4K Monitor',
    description: 'IPS 4K UHD monitor with HDR10 and USB-C power delivery.',
    price: 329.99,
    category: 'Electronics',
    images: [image('4k-monitor')],
    stock: 18,
    daysAgo: 23,
  },
  {
    title: 'Noise Cancelling Headphones',
    description: 'Over-ear Bluetooth headphones with active noise cancelling and 30 h battery.',
    price: 199,
    category: 'Electronics',
    images: [image('headphones')],
    stock: 32,
    daysAgo: 51,
  },
  {
    title: 'Clean Code',
    description: 'A handbook of agile software craftsmanship by Robert C. Martin.',
    price: 37.8,
    category: 'Books',
    images: [image('clean-code')],
    stock: 60,
    daysAgo: 3,
  },
  {
    title: 'Domain-Driven Design',
    description: 'Tackling complexity in the heart of software, by Eric Evans.',
    price: 54.25,
    category: 'Books',
    images: [image('ddd-book')],
    stock: 14,
    daysAgo: 17,
  },
  {
    title: 'The Pragmatic Programmer',
    description: 'Your journey to mastery, 20th anniversary edition.',
    price: 42.1,
    category: 'Books',
    images: [image('pragmatic-programmer')],
    stock: 27,
    daysAgo: 34,
  },
  {
    title: 'Refactoring',
    description: 'Improving the design of existing code, second edition.',
    price: 47.99,
    category: 'Books',
    images: [],
    stock: 0,
    daysAgo: 58,
  },
  {
    title: 'Running Shoes',
    description: 'Lightweight running shoes with breathable mesh and cushioned sole.',
    price: 74.95,
    category: 'Sports',
    images: [image('running-shoes')],
    stock: 85,
    daysAgo: 2,
  },
  {
    title: 'Yoga Mat',
    description: 'Non-slip 6 mm yoga mat with carrying strap.',
    price: 19.99,
    category: 'Sports',
    images: [image('yoga-mat')],
    stock: 150,
    daysAgo: 12,
  },
  {
    title: 'Adjustable Dumbbells',
    description: 'Pair of adjustable dumbbells from 2 to 24 kg with storage tray.',
    price: 249.0,
    category: 'Sports',
    images: [image('dumbbells')],
    stock: 9,
    daysAgo: 29,
  },
  {
    title: 'Mountain Bike Helmet',
    description: 'Ventilated MTB helmet with adjustable visor and MIPS protection.',
    price: 64.4,
    category: 'Sports',
    images: [image('bike-helmet')],
    stock: 22,
    daysAgo: 46,
  },
  {
    title: 'Espresso Machine',
    description: '15-bar espresso machine with milk frother and removable water tank.',
    price: 159.9,
    category: 'Home',
    images: [image('espresso-machine')],
    stock: 12,
    daysAgo: 4,
  },
  {
    title: 'Cast Iron Skillet',
    description: 'Pre-seasoned 30 cm cast iron skillet for stovetop and oven.',
    price: 34.5,
    category: 'Home',
    images: [image('skillet')],
    stock: 70,
    daysAgo: 15,
  },
  {
    title: 'LED Desk Lamp',
    description: 'Dimmable LED desk lamp with three color temperatures and USB port.',
    price: 29.75,
    category: 'Home',
    images: [image('desk-lamp')],
    stock: 54,
    daysAgo: 38,
  },
  {
    title: 'Memory Foam Pillow',
    description: 'Contour memory foam pillow with washable bamboo cover.',
    price: 39.0,
    category: 'Home',
    images: [image('pillow')],
    stock: 3,
    daysAgo: 55,
  },
  {
    title: 'Building Blocks Set',
    description: 'Creative set of 500 building blocks for ages 6 and up.',
    price: 49.99,
    category: 'Toys',
    images: [image('building-blocks')],
    stock: 40,
    daysAgo: 8,
  },
  {
    title: 'Remote Control Car',
    description: 'Off-road RC car with 2.4 GHz remote and rechargeable battery.',
    price: 59.9,
    category: 'Toys',
    images: [image('rc-car')],
    stock: 16,
    daysAgo: 20,
  },
  {
    title: 'Wooden Puzzle',
    description: 'Hand-made 100-piece wooden jigsaw puzzle.',
    price: 15.25,
    category: 'Toys',
    images: [image('wooden-puzzle')],
    stock: 95,
    daysAgo: 42,
  },
  {
    title: 'Plush Teddy Bear',
    description: 'Soft 40 cm plush teddy bear, machine washable.',
    price: 22.0,
    category: 'Toys',
    images: [image('teddy-bear')],
    stock: 61,
    daysAgo: 59,
  },
];

/**
 * Idempotent by emptiness rather than by key: once the collection has any product (seeded or
 * created by hand), nothing is inserted, so running it again never duplicates or edits data.
 */
export async function seedProducts(now: Date = new Date()): Promise<ProductSeedResult> {
  if (await productsService.hasProducts()) {
    return { inserted: 0, skipped: true };
  }
  const inserted = await productsService.importProducts(
    SAMPLE_PRODUCTS.map(({ daysAgo, ...product }) => ({
      ...product,
      creationAt: new Date(now.getTime() - daysAgo * DAY_MS),
    })),
  );
  return { inserted, skipped: false };
}
