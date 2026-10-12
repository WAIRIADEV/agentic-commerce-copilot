import { products } from '../lib/products';

export default function Home() {
  return (
    <main className="p-10 font-sans">
      <h1 className="text-3xl font-bold mb-6">Product Catalog Test</h1>
      <p className="mb-4 text-gray-600">Total products loaded: {products.length}</p>
      <ul className="space-y-2">
        {products.map((p) => (
          <li key={p.id} className="border p-3 rounded">
            <strong>{p.name}</strong> — ${p.price} (Eco Score: {p.ecoScore})
          </li>
        ))}
      </ul>
    </main>
  );
}