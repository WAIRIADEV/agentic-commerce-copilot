import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { searchProducts, type Product } from '../../../lib/products';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages: ChatMessage[] = body.messages || [];
    const lastUserMessage =
      [...messages].reverse().find((m) => m.role === 'user')?.content || '';

    // ── Step 1: Ask the AI to extract search parameters as JSON ──
    const parseResponse = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [
        {
          role: 'system',
          content: `You extract search parameters from a user's shopping request.
Return ONLY valid JSON, no explanation, no markdown, no code fences.
Format: {"query": "keyword", "maxPrice": number or null}
Examples:
- "Find an eco-friendly gift under 50 dollars" → {"query":"eco-friendly","maxPrice":50}
- "I want a tech gadget" → {"query":"tech","maxPrice":null}
- "cheap candle for my mom" → {"query":"candle","maxPrice":null}`,
        },
        { role: 'user', content: lastUserMessage },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const rawParse = parseResponse.choices[0]?.message?.content || '{}';

    let parsed: { query?: string; maxPrice?: number | null } = {};
    try {
      parsed = JSON.parse(rawParse);
    } catch {
      parsed = { query: lastUserMessage, maxPrice: null };
    }

    const query = parsed.query || lastUserMessage;
    const maxPrice =
      typeof parsed.maxPrice === 'number' ? parsed.maxPrice : undefined;

    // ── Step 2: Run our own search ──
    let matchedProducts: Product[] = searchProducts(query, maxPrice);

    // Fallback: if no matches, try broader search without price
    if (matchedProducts.length === 0) {
      matchedProducts = searchProducts(query);
    }
    if (matchedProducts.length === 0) {
      matchedProducts = searchProducts('gift');
    }

    // ── Step 3: Ask the AI to recommend one from the results ──
    const catalogText = matchedProducts
      .map(
        (p) =>
          `- id=${p.id} | ${p.name} | $${p.price} | ecoScore:${p.ecoScore} | ships in ${p.shippingDays}d | rating:${p.rating}`
      )
      .join('\n');

    const recommendResponse = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [
        {
          role: 'system',
          content: `You are an AI shopping agent for the "Agentic Commerce Copilot" demo.
You will be given a list of products. Recommend exactly ONE of them in a friendly, concise reply.
Mention the name, price, and eco score. End with a clear one-line recommendation.
Never invent products. Only recommend from the list provided.`,
        },
        {
          role: 'user',
          content: `User asked: "${lastUserMessage}"

Products available:
${catalogText}

Recommend one product.`,
        },
      ],
      temperature: 0.5,
    });

    const reply =
      recommendResponse.choices[0]?.message?.content ||
      "Sorry, I couldn't put together a recommendation.";

    return NextResponse.json({
      reply,
      products: matchedProducts,
    });
  } catch (err) {
    console.error('Chat error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}