import Link from 'next/link';

export default function CancelPage() {
  return (
    <div className="max-w-xl mx-auto p-8 text-center">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-yellow-800 mb-2">
          Payment cancelled
        </h1>
        <p className="text-yellow-700 mb-4">
          You cancelled the PayPal checkout. No payment was made.
        </p>
        <Link
          href="/"
          className="inline-block bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
        >
          ← Back to chat
        </Link>
      </div>
    </div>
  );
}