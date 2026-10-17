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
    title: 'Mouse inalámbrico',
    description: 'Mouse inalámbrico ergonómico de 2,4 GHz con clic silencioso y receptor USB.',
    price: 24.99,
    category: 'Electrónica',
    images: [image('wireless-mouse')],
    stock: 120,
    daysAgo: 1,
  },
  {
    title: 'Teclado mecánico',
    description:
      'Teclado mecánico compacto de 87 teclas con interruptores intercambiables en caliente.',
    price: 89.5,
    category: 'Electrónica',
    images: [image('mechanical-keyboard'), image('mechanical-keyboard-2')],
    stock: 45,
    daysAgo: 6,
  },
  {
    title: 'Monitor 4K de 27"',
    description: 'Monitor IPS 4K UHD con HDR10 y carga por USB-C.',
    price: 329.99,
    category: 'Electrónica',
    images: [image('4k-monitor')],
    stock: 18,
    daysAgo: 23,
  },
  {
    title: 'Auriculares con cancelación de ruido',
    description:
      'Auriculares Bluetooth over-ear con cancelación activa de ruido y 30 h de batería.',
    price: 199,
    category: 'Electrónica',
    images: [image('headphones')],
    stock: 32,
    daysAgo: 51,
  },
  {
    title: 'Código limpio',
    description: 'Manual de desarrollo ágil de software de Robert C. Martin.',
    price: 37.8,
    category: 'Libros',
    images: [image('clean-code')],
    stock: 60,
    daysAgo: 3,
  },
  {
    title: 'Diseño guiado por el dominio',
    description: 'Cómo abordar la complejidad en el corazón del software, de Eric Evans.',
    price: 54.25,
    category: 'Libros',
    images: [image('ddd-book')],
    stock: 14,
    daysAgo: 17,
  },
  {
    title: 'El programador pragmático',
    description: 'Tu camino hacia la maestría, edición del 20.º aniversario.',
    price: 42.1,
    category: 'Libros',
    images: [image('pragmatic-programmer')],
    stock: 27,
    daysAgo: 34,
  },
  {
    title: 'Refactorización',
    description: 'Cómo mejorar el diseño del código existente, segunda edición.',
    price: 47.99,
    category: 'Libros',
    images: [],
    stock: 0,
    daysAgo: 58,
  },
  {
    title: 'Zapatillas de running',
    description: 'Zapatillas de running livianas con malla transpirable y suela amortiguada.',
    price: 74.95,
    category: 'Deportes',
    images: [image('running-shoes')],
    stock: 85,
    daysAgo: 2,
  },
  {
    title: 'Esterilla de yoga',
    description: 'Esterilla de yoga antideslizante de 6 mm con correa de transporte.',
    price: 19.99,
    category: 'Deportes',
    images: [image('yoga-mat')],
    stock: 150,
    daysAgo: 12,
  },
  {
    title: 'Mancuernas ajustables',
    description: 'Par de mancuernas ajustables de 2 a 24 kg con bandeja de almacenamiento.',
    price: 249.0,
    category: 'Deportes',
    images: [image('dumbbells')],
    stock: 9,
    daysAgo: 29,
  },
  {
    title: 'Casco de bicicleta de montaña',
    description: 'Casco de MTB ventilado con visera regulable y protección MIPS.',
    price: 64.4,
    category: 'Deportes',
    images: [image('bike-helmet')],
    stock: 22,
    daysAgo: 46,
  },
  {
    title: 'Cafetera espresso',
    description:
      'Cafetera espresso de 15 bares con espumador de leche y depósito de agua extraíble.',
    price: 159.9,
    category: 'Hogar',
    images: [image('espresso-machine')],
    stock: 12,
    daysAgo: 4,
  },
  {
    title: 'Sartén de hierro fundido',
    description: 'Sartén de hierro fundido de 30 cm, curada de fábrica, para hornalla y horno.',
    price: 34.5,
    category: 'Hogar',
    images: [image('skillet')],
    stock: 70,
    daysAgo: 15,
  },
  {
    title: 'Lámpara de escritorio LED',
    description: 'Lámpara de escritorio LED regulable con tres temperaturas de color y puerto USB.',
    price: 29.75,
    category: 'Hogar',
    images: [image('desk-lamp')],
    stock: 54,
    daysAgo: 38,
  },
  {
    title: 'Almohada viscoelástica',
    description: 'Almohada ergonómica viscoelástica con funda de bambú lavable.',
    price: 39.0,
    category: 'Hogar',
    images: [image('pillow')],
    stock: 3,
    daysAgo: 55,
  },
  {
    title: 'Set de bloques de construcción',
    description: 'Set creativo de 500 bloques de construcción para mayores de 6 años.',
    price: 49.99,
    category: 'Juguetes',
    images: [image('building-blocks')],
    stock: 40,
    daysAgo: 8,
  },
  {
    title: 'Auto a control remoto',
    description: 'Auto todoterreno a control remoto de 2,4 GHz con batería recargable.',
    price: 59.9,
    category: 'Juguetes',
    images: [image('rc-car')],
    stock: 16,
    daysAgo: 20,
  },
  {
    title: 'Rompecabezas de madera',
    description: 'Rompecabezas de madera de 100 piezas hecho a mano.',
    price: 15.25,
    category: 'Juguetes',
    images: [image('wooden-puzzle')],
    stock: 95,
    daysAgo: 42,
  },
  {
    title: 'Oso de peluche',
    description: 'Oso de peluche suave de 40 cm, lavable a máquina.',
    price: 22.0,
    category: 'Juguetes',
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
