import { productsService, type CreateProductInput } from '../modules/products/index.js';

export interface SampleProduct extends CreateProductInput {
  daysAgo: number;
}

export interface ProductSeedResult {
  inserted: number;
  skipped: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Free-to-use Pexels photos; products with several images show the same item from different angles.
const image = (id: number): string =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=800`;

export const SAMPLE_PRODUCTS: readonly SampleProduct[] = [
  {
    title: 'Mouse inalámbrico',
    description: 'Mouse inalámbrico ergonómico de 2,4 GHz con clic silencioso y receptor USB.',
    price: 89900,
    category: 'Electrónica',
    images: [image(14401665)],
    stock: 120,
    daysAgo: 1,
  },
  {
    title: 'Teclado mecánico',
    description:
      'Teclado mecánico compacto de 87 teclas con interruptores intercambiables en caliente.',
    price: 349900,
    category: 'Electrónica',
    images: [image(32755758), image(32755764)],
    stock: 45,
    daysAgo: 6,
  },
  {
    title: 'Monitor 4K de 27"',
    description: 'Monitor IPS 4K UHD con HDR10 y carga por USB-C.',
    price: 1699900,
    category: 'Electrónica',
    images: [image(6177594)],
    stock: 18,
    daysAgo: 23,
  },
  {
    title: 'Auriculares con cancelación de ruido',
    description:
      'Auriculares Bluetooth over-ear con cancelación activa de ruido y 30 h de batería.',
    price: 899900,
    category: 'Electrónica',
    images: [image(5269735), image(5269760)],
    stock: 32,
    daysAgo: 51,
  },
  {
    title: 'Código limpio',
    description: 'Manual de desarrollo ágil de software de Robert C. Martin.',
    price: 159900,
    category: 'Libros',
    images: [image(6373290)],
    stock: 60,
    daysAgo: 3,
  },
  {
    title: 'Diseño guiado por el dominio',
    description: 'Cómo abordar la complejidad en el corazón del software, de Eric Evans.',
    price: 229900,
    category: 'Libros',
    images: [image(10946433)],
    stock: 14,
    daysAgo: 17,
  },
  {
    title: 'El programador pragmático',
    description: 'Tu camino hacia la maestría, edición del 20.º aniversario.',
    price: 179900,
    category: 'Libros',
    images: [image(13745709)],
    stock: 27,
    daysAgo: 34,
  },
  {
    title: 'Refactorización',
    description: 'Cómo mejorar el diseño del código existente, segunda edición.',
    price: 199900,
    category: 'Libros',
    images: [],
    stock: 0,
    daysAgo: 58,
  },
  {
    title: 'Zapatillas de running',
    description: 'Zapatillas de running livianas con malla transpirable y suela amortiguada.',
    price: 389900,
    category: 'Deportes',
    images: [image(29603277)],
    stock: 85,
    daysAgo: 2,
  },
  {
    title: 'Esterilla de yoga',
    description: 'Esterilla de yoga antideslizante de 6 mm con correa de transporte.',
    price: 79900,
    category: 'Deportes',
    images: [image(16143600)],
    stock: 150,
    daysAgo: 12,
  },
  {
    title: 'Mancuernas ajustables',
    description: 'Par de mancuernas ajustables de 2 a 24 kg con bandeja de almacenamiento.',
    price: 1049900,
    category: 'Deportes',
    images: [image(669580)],
    stock: 9,
    daysAgo: 29,
  },
  {
    title: 'Casco de bicicleta de montaña',
    description: 'Casco de MTB ventilado con visera regulable y protección MIPS.',
    price: 269900,
    category: 'Deportes',
    images: [image(12956080)],
    stock: 22,
    daysAgo: 46,
  },
  {
    title: 'Cafetera espresso',
    description:
      'Cafetera espresso de 15 bares con espumador de leche y depósito de agua extraíble.',
    price: 749900,
    category: 'Hogar',
    images: [image(6032797), image(6032799)],
    stock: 12,
    daysAgo: 4,
  },
  {
    title: 'Sartén de hierro fundido',
    description: 'Sartén de hierro fundido de 30 cm, curada de fábrica, para hornalla y horno.',
    price: 149900,
    category: 'Hogar',
    images: [image(6294378)],
    stock: 70,
    daysAgo: 15,
  },
  {
    title: 'Lámpara de escritorio LED',
    description: 'Lámpara de escritorio LED regulable con tres temperaturas de color y puerto USB.',
    price: 119900,
    category: 'Hogar',
    images: [image(10440498)],
    stock: 54,
    daysAgo: 38,
  },
  {
    title: 'Almohada viscoelástica',
    description: 'Almohada ergonómica viscoelástica con funda de bambú lavable.',
    price: 159900,
    category: 'Hogar',
    images: [image(11036444)],
    stock: 3,
    daysAgo: 55,
  },
  {
    title: 'Set de bloques de construcción',
    description: 'Set creativo de 500 bloques de construcción para mayores de 6 años.',
    price: 209900,
    category: 'Juguetes',
    images: [image(4491711)],
    stock: 40,
    daysAgo: 8,
  },
  {
    title: 'Auto a control remoto',
    description: 'Auto todoterreno a control remoto de 2,4 GHz con batería recargable.',
    price: 249900,
    category: 'Juguetes',
    images: [image(9227215)],
    stock: 16,
    daysAgo: 20,
  },
  {
    title: 'Rompecabezas de madera',
    description: 'Rompecabezas de madera de 100 piezas hecho a mano.',
    price: 64900,
    category: 'Juguetes',
    images: [image(32350933)],
    stock: 95,
    daysAgo: 42,
  },
  {
    title: 'Oso de peluche',
    description: 'Oso de peluche suave de 40 cm, lavable a máquina.',
    price: 94900,
    category: 'Juguetes',
    images: [image(31556990)],
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
