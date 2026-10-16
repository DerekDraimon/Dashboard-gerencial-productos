export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  stock: number;
  creationAt: Date;
  updatedAt: Date;
}

export interface ListProductsFilter {
  offset: number;
  limit: number;
  search?: string;
  /** Start of a UTC day; products created from that instant on. */
  from?: Date;
  /** Start of a UTC day; the whole day is included. */
  to?: Date;
}
