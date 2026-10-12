'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

type CaptureResult = {
  success: boolean;
  orderId: string;
  status: string;
  payerName: string | null;
  payerEmail: string | null;
  amount: string | null;
  currency: string | null;
  captureId: string | null;
  captureStatus: string | null;
};

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams?.get('token') ?? null;
  const ranRef = useRef(false);

  // Lazy init — no setState inside the effect body
  const [state, setState] = useState<'capturing' | 'success' | 'error'>(
    orderId ? 'capturing' : 'error'
  );
  const [result, setResult] = useState<CaptureResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(
    orderId ? null : 'No order ID was provided.'
  );

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    if (!orderId) return;

    async function capture() {
      try {
        const res = await fetch('/api/paypal/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        });

        const data: CaptureResult & { error?: string } = await res.json();

        if (!res.ok || !data.success) {
          setState('error');
          setErrorMsg(data.error || 'Payment capture failed.');
          return;
        }

        setResult(data);
        setState('success');
      } catch (err) {
        setState('error');
        setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
      }
    }

    capture();
  }, [orderId]);

  if (state === 'capturing') {
    return (
      <div className="max-w-xl mx-auto p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-blue-100 mx-auto mb-4 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Capturing payment...</h1>
        <p className="text-gray-600">Talking to PayPal. One moment.</p>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="max-w-xl mx-auto p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h1 className="text-2xl font-bold text-red-700 mb-2">
            Something went wrong
          </h1>
          <p className="text-red-700 mb-4">{errorMsg}</p>
          <Link
            href="/"
            className="inline-block bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            ← Back to chat
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-8">
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center mb-4 text-2xl">
          ✓
        </div>
        <h1 className="text-3xl font-bold text-green-800 mb-2">
          Payment Successful
        </h1>
        <p className="text-green-700 mb-6">
          The AI agent successfully completed your purchase.
        </p>

        <div className="bg-white rounded-lg p-5 border border-green-100 space-y-3 text-sm">
          {result?.payerName && (
            <Row label="Paid by" value={result.payerName} />
          )}
          {result?.payerEmail && (
            <Row label="Email" value={result.payerEmail} />
          )}
          <Row
            label="Amount"
            value={
              result?.amount
                ? `${result.amount} ${result.currency ?? ''}`
                : '—'
            }
          />
          <Row label="Order ID" value={result?.orderId ?? '—'} mono />
          <Row label="Capture ID" value={result?.captureId ?? '—'} mono />
          <Row
            label="Status"
            value={result?.status ?? '—'}
            badge="success"
          />
        </div>

        <Link
          href="/"
          className="inline-block mt-6 bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700 font-medium"
        >
          ← Back to chat
        </Link>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  badge,
}: {
  label: string;
  value: string;
  mono?: boolean;
  badge?: 'success';
}) {
  return (
    <div className="flex justify-between items-center gap-4">
      <span className="text-gray-500">{label}</span>
      {badge === 'success' ? (
        <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-semibold">
          {value}
        </span>
      ) : (
        <span
          className={`text-gray-900 font-medium ${
            mono ? 'font-mono text-xs' : ''
          } text-right`}
        >
          {value}
        </span>
      )}
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-xl mx-auto p-8 text-center text-gray-500">
          Loading...
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}