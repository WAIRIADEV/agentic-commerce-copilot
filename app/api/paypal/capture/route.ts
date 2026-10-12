import { NextResponse } from 'next/server';
import { captureOrder } from '../../../../lib/paypal';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId is required' },
        { status: 400 }
      );
    }

    const result = await captureOrder(orderId);

    const capture =
      result.purchase_units?.[0]?.payments?.captures?.[0] ?? null;

    return NextResponse.json({
      success: true,
      orderId: result.id,
      status: result.status,
      payerName:
        result.payer?.name?.given_name
          ? `${result.payer.name.given_name} ${result.payer.name.surname ?? ''}`.trim()
          : null,
      payerEmail: result.payer?.email_address ?? null,
      amount: capture?.amount?.value ?? null,
      currency: capture?.amount?.currency_code ?? null,
      captureId: capture?.id ?? null,
      captureStatus: capture?.status ?? null,
    });
  } catch (err) {
    console.error('Capture order error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}