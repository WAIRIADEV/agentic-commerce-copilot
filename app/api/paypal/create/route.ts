import { NextResponse } from 'next/server';
import { createOrder } from '../../../../lib/paypal';
import { products } from '../../../../lib/products';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'productId is required' },
        { status: 400 }
      );
    }

    const product = products.find((p) => p.id === productId);
    if (!product) {
      return NextResponse.json(
        { error: `Product not found: ${productId}` },
        { status: 404 }
      );
    }

    const order = await createOrder({
      id: product.id,
      name: product.name,
      price: product.price,
    });

    const approvalUrl = order.links?.find(
      (l: { rel: string; href: string }) => l.rel === 'approve'
    )?.href;

    if (!approvalUrl) {
      return NextResponse.json(
        { error: 'No approval URL returned from PayPal' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      orderId: order.id,
      approvalUrl,
      product,
    });
  } catch (err) {
    console.error('Create order error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}