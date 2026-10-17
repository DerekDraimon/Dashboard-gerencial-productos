import { httpClient } from '../../../shared/api/http-client';

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  stock: number;
  creationAt: string;
  updatedAt: string;
}

export interface ProductPage {
  data: Product[];
  meta: { total: number; offset: number; limit: number };
}

export interface ListProductsParams {
  offset: number;
  limit: number;
  search?: string;
  /** YYYY-MM-DD */
  from?: string;
  /** YYYY-MM-DD */
  to?: string;
}

export interface RequestOptions {
  signal?: AbortSignal;
}

export async function listProducts(
  { offset, limit, search, from, to }: ListProductsParams,
  { signal }: RequestOptions = {},
): Promise<ProductPage> {
  const params: Record<string, string | number> = { offset, limit };
  for (const [key, value] of Object.entries({ search, from, to })) {
    if (value) params[key] = value;
  }
  const response = await httpClient.get<ProductPage>('/products', { params, signal });
  return response.data;
}
