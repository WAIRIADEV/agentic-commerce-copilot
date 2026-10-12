'use client';

import { useState, useRef, useEffect } from 'react';
import ProductTable from '../components/ProductTable';

type Product = {
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

type Message = {
  role: 'user' | 'assistant';
  content: string;
  products?: Product[];
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [view, setView] = useState<'cards' | 'table'>('cards');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages([
          ...nextMessages,
          {
            role: 'assistant',
            content: `Error: ${data.error || 'Something went wrong'}`,
          },
        ]);
      } else {
        setMessages([
          ...nextMessages,
          {
            role: 'assistant',
            content: data.reply,
            products: data.products || [],
          },
        ]);
      }
    } catch (err) {
      setMessages([
        ...nextMessages,
        {
          role: 'assistant',
          content:
            err instanceof Error ? `Error: ${err.message}` : 'Unknown error',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function buyProduct(product: Product) {
    setBuyingId(product.id);
    try {
      const res = await fetch('/api/paypal/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.approvalUrl) {
        alert(`Error: ${data.error || 'Could not create order'}`);
        setBuyingId(null);
        return;
      }
      window.location.href = data.approvalUrl;
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unknown error');
      setBuyingId(null);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
              AI
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">
                Agentic Commerce Copilot
              </h1>
              <p className="text-xs text-gray-500">
                Powered by Groq + PayPal sandbox + AG Grid
              </p>
            </div>
          </div>

          <div className="flex bg-gray-100 rounded-full p-1 text-xs">
            <button
              onClick={() => setView('cards')}
              className={`px-3 py-1 rounded-full font-medium transition ${
                view === 'cards'
                  ? 'bg-white shadow text-gray-900'
                  : 'text-gray-500'
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setView('table')}
              className={`px-3 py-1 rounded-full font-medium transition ${
                view === 'table'
                  ? 'bg-white shadow text-gray-900'
                  : 'text-gray-500'
              }`}
            >
              Table
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
          {messages.length === 0 && <EmptyState />}

          {messages.map((msg, i) => (
            <MessageBubble
              key={i}
              message={msg}
              onBuy={buyProduct}
              buyingId={buyingId}
              view={view}
            />
          ))}

          {loading && (
            <div className="flex gap-3">
              <Avatar role="assistant" />
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 text-gray-500 text-sm">
                Thinking...
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 px-6 py-4">
        <form onSubmit={sendMessage} className="max-w-5xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Try: Find me an eco-friendly gift under $50"
            className="flex-1 border border-gray-300 rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-full font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </footer>
    </div>
  );
}

function EmptyState() {
  const suggestions = [
    'Find me an eco-friendly gift under $50',
    'I need a tech gift for a friend',
    'Show me something under $25 for a birthday',
  ];
  return (
    <div className="text-center py-16">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        What are you shopping for?
      </h2>
      <p className="text-gray-500 mb-8">
        Describe what you want. The AI agent will find it and check out with
        PayPal.
      </p>
      <div className="space-y-2 max-w-md mx-auto">
        {suggestions.map((s) => (
          <div
            key={s}
            className="bg-white border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-600"
          >
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

function Avatar({ role }: { role: 'user' | 'assistant' }) {
  if (role === 'user') {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
        You
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
      AI
    </div>
  );
}

function MessageBubble({
  message,
  onBuy,
  buyingId,
  view,
}: {
  message: Message;
  onBuy: (p: Product) => void;
  buyingId: string | null;
  view: 'cards' | 'table';
}) {
  const isUser = message.role === 'user';
  const hasProducts = message.products && message.products.length > 0;
  const recommendedId = hasProducts ? message.products![0].id : undefined;

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <Avatar role={message.role} />
      <div className={`flex-1 ${isUser ? 'flex justify-end' : ''}`}>
        <div className="max-w-3xl w-full">
          <div
            className={`rounded-2xl px-4 py-3 whitespace-pre-wrap text-sm ${
              isUser
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-200 text-gray-900'
            }`}
          >
            {message.content}
          </div>

          {hasProducts && view === 'cards' && (
            <div className="mt-4 space-y-3">
              <ProductCard
                product={message.products![0]}
                onBuy={onBuy}
                highlighted
                buyingId={buyingId}
              />
              {message.products!.length > 1 && (
                <>
                  <p className="text-xs text-gray-500 mt-4 mb-2">
                    Other matches ({message.products!.length - 1})
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {message.products!.slice(1, 5).map((p) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        onBuy={onBuy}
                        buyingId={buyingId}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {hasProducts && view === 'table' && (
            <div className="mt-4">
              <ProductTable
                products={message.products!}
                recommendedId={recommendedId}
                onBuy={onBuy}
                buyingId={buyingId}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductCard({
  product,
  onBuy,
  highlighted,
  buyingId,
}: {
  product: Product;
  onBuy: (p: Product) => void;
  highlighted?: boolean;
  buyingId: string | null;
}) {
  const isBuying = buyingId === product.id;
  return (
    <div
      className={`rounded-xl border overflow-hidden bg-white transition ${
        highlighted
          ? 'border-green-400 ring-2 ring-green-100'
          : 'border-gray-200'
      }`}
    >
      <div className="aspect-video bg-gray-100 overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="p-4">
        {highlighted && (
          <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded mb-2">
            AI&apos;s Pick
          </span>
        )}
        <h3 className="font-semibold text-gray-900">{product.name}</h3>
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
          {product.description}
        </p>
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
          <span>Rating {product.rating}</span>
          <span>·</span>
          <span>Eco {product.ecoScore}/10</span>
          <span>·</span>
          <span>Ships in {product.shippingDays}d</span>
        </div>
        <div className="flex items-center justify-between mt-4">
          <span className="text-lg font-bold text-gray-900">
            ${product.price.toFixed(2)}
          </span>
          <button
            onClick={() => onBuy(product)}
            disabled={isBuying}
            className="bg-[#0070ba] hover:bg-[#005ea6] text-white text-sm font-medium px-4 py-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isBuying ? 'Redirecting...' : 'Buy with PayPal'}
          </button>
        </div>
      </div>
    </div>
  );
}