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

export interface ProductInput {
  title: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  stock: number;
}

export async function getProduct(id: string, { signal }: RequestOptions = {}): Promise<Product> {
  const response = await httpClient.get<Product>(`/products/${encodeURIComponent(id)}`, { signal });
  return response.data;
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const response = await httpClient.post<Product>('/products', input);
  return response.data;
}

export async function updateProduct(id: string, patch: Partial<ProductInput>): Promise<Product> {
  const response = await httpClient.patch<Product>(`/products/${encodeURIComponent(id)}`, patch);
  return response.data;
}

export async function deleteProduct(id: string): Promise<void> {
  await httpClient.delete(`/products/${encodeURIComponent(id)}`);
}

export async function listCategories({ signal }: RequestOptions = {}): Promise<string[]> {
  const response = await httpClient.get<string[]>('/products/categories', { signal });
  return response.data;
}
