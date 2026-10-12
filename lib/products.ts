import productsData from '../data/products.json';

export type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
  ecoScore: number;
  shippingDays: number;
  rating: number;
  tags: string[];
  image: string;
};

export const products: Product[] = productsData as Product[];

export function searchProducts(query: string, maxPrice?: number): Product[] {
  const lowerQuery = query.toLowerCase();

  return products.filter((p) => {
    const matchesQuery =
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery) ||
      p.tags.some((tag) => tag.toLowerCase().includes(lowerQuery));

    const matchesPrice = maxPrice ? p.price <= maxPrice : true;

    return matchesQuery && matchesPrice;
  });
}