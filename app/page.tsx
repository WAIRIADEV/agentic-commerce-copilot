'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
  ecoScore: number;
  shippingDays: number;
  rating: number;
  tags: string[];
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
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
            AI
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">
              Agentic Commerce Copilot
            </h1>
            <p className="text-xs text-gray-500">
              Powered by Groq + PayPal sandbox
            </p>
          </div>
        </div>
      </header>

      {/* Chat area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
          {messages.length === 0 && <EmptyState />}

          {messages.map((msg, i) => (
            <MessageBubble
              key={i}
              message={msg}
              onBuy={buyProduct}
              buyingId={buyingId}
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

      {/* Input */}
      <footer className="bg-white border-t border-gray-200 px-6 py-4">
        <form
          onSubmit={sendMessage}
          className="max-w-4xl mx-auto flex gap-2"
        >
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
}: {
  message: Message;
  onBuy: (p: Product) => void;
  buyingId: string | null;
}) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <Avatar role={message.role} />
      <div className={`flex-1 ${isUser ? 'flex justify-end' : ''}`}>
        <div className="max-w-2xl">
          <div
            className={`rounded-2xl px-4 py-3 whitespace-pre-wrap text-sm ${
              isUser
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-200 text-gray-900'
            }`}
          >
            {message.content}
          </div>

          {message.products && message.products.length > 0 && (
            <ProductList
              products={message.products}
              onBuy={onBuy}
              buyingId={buyingId}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ProductList({
  products,
  onBuy,
  buyingId,
}: {
  products: Product[];
  onBuy: (p: Product) => void;
  buyingId: string | null;
}) {
  const [top, ...rest] = products;
  return (
    <div className="mt-4 space-y-3">
      {top && <ProductCard product={top} onBuy={onBuy} highlighted buyingId={buyingId} />}

      {rest.length > 0 && (
        <>
          <p className="text-xs text-gray-500 mt-4 mb-2">
            Other matches ({rest.length})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rest.slice(0, 4).map((p) => (
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
      className={`rounded-xl border p-4 bg-white transition ${
        highlighted
          ? 'border-green-400 ring-2 ring-green-100'
          : 'border-gray-200'
      }`}
    >
      {highlighted && (
        <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded mb-2">
          ⭐ AI&apos;s Pick
        </span>
      )}
      <h3 className="font-semibold text-gray-900">{product.name}</h3>
      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
        {product.description}
      </p>
      <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
        <span>⭐ {product.rating}</span>
        <span>🌱 Eco {product.ecoScore}/10</span>
        <span>🚚 {product.shippingDays}d</span>
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
  );
}