import { NextResponse } from 'next/server';
import { createOrder } from '../../../lib/paypal';

export async function GET() {
  try {
    const order = await createOrder({
      id: 'p_001',
      name: 'Bamboo Toothbrush Set',
      price: 12.99,
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      status: order.status,
      approvalUrl: order.links?.find(
        (l: { rel: string; href: string }) => l.rel === 'approve'
      )?.href,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}