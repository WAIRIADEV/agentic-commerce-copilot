const PAYPAL_BASE_URL = process.env.PAYPAL_BASE_URL!;
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;

// Step 1: Get an access token from PayPal
async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

  const res = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`PayPal auth failed: ${error}`);
  }

  const data = await res.json();
  return data.access_token;
}

// Step 2: Create an order
export async function createOrder(product: {
  id: string;
  name: string;
  price: number;
}) {
  const token = await getAccessToken();

  const res = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: product.id,
          description: product.name,
          amount: {
            currency_code: 'USD',
            value: product.price.toFixed(2),
          },
        },
      ],
      application_context: {
        brand_name: 'Agentic Commerce Copilot',
        user_action: 'PAY_NOW',
        return_url: `${process.env.APP_URL}/success`,
        cancel_url: `${process.env.APP_URL}/cancel`,
      },
    }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`PayPal create order failed: ${error}`);
  }

  return res.json();
}

// Step 3: Capture an order
export async function captureOrder(orderId: string) {
  const token = await getAccessToken();

  const res = await fetch(
    `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    }
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`PayPal capture failed: ${error}`);
  }

  return res.json();
}