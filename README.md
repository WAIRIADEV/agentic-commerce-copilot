# Agentic Commerce Copilot

An AI shopping agent that finds products, recommends one, and completes checkout using **PayPal** — end to end.

Built for the [PayPal AI Hackathon: Build What's Next with PayPal and AI](https://paypalaihackathon.devpost.com/).

![Demo](docs/demo.png)

## What it does

Users describe what they're shopping for in plain English. An AI agent:

1. **Parses the request** into structured search parameters (`query`, `maxPrice`)
2. **Searches** a product catalog and returns matches
3. **Recommends one product** with a short, plain-text explanation
4. **Displays results** as cards or a sortable AG Grid comparison table
5. **Completes checkout** — clicking "Buy with PayPal" creates a real PayPal sandbox order, redirects the user to approve, then captures payment on return
6. **Shows a receipt** with payer info, order ID, capture ID, and a product recap

## Live demo

- **Hosted demo:** _[add Render URL after deploy]_
- **Demo video:** _[add YouTube URL after recording]_

## Architecture

```
┌─────────────────┐         ┌──────────────────────┐
│   Browser UI    │  POST   │  /api/chat           │
│  (Next.js page) ├────────▶│  • Groq parses query │
│                 │         │  • Searches catalog  │
│                 │◀────────┤  • Recommends 1 item │
└────────┬────────┘         └──────────────────────┘
         │
         │ POST productId
         ▼
┌─────────────────────┐     ┌────────────────────┐
│ /api/paypal/create  ├────▶│  PayPal Orders v2  │
│                     │◀────┤  (sandbox)         │
└─────────────────────┘     └────────────────────┘
         │
         │ approvalUrl
         ▼
    [User approves on paypal.com]
         │
         │ ?token=ORDER_ID
         ▼
┌─────────────────────┐     ┌────────────────────┐
│ /api/paypal/capture ├────▶│  PayPal Capture    │
│                     │◀────┤  (sandbox)         │
└─────────────────────┘     └────────────────────┘
         │
         ▼
   Receipt + product recap
```

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router, Turbopack) | Server routes + React UI in one project |
| AI | Groq SDK (`openai/gpt-oss-120b`) | Free tier, fast inference, JSON mode |
| Payments | PayPal Orders v2 REST API (sandbox) | The core of the hackathon |
| UI table | AG Grid Community | Sortable/filterable product comparison |
| Styling | Tailwind CSS v4 | Rapid UI iteration |
| Language | TypeScript | Type-safe API contracts |

## Tools used (hackathon submission)

- **AI model/service:** Groq API with `openai/gpt-oss-120b` — used for two things:
  1. Parsing the user's natural-language request into structured JSON search params
  2. Recommending one product from the search results with plain-text reasoning
- **PayPal APIs used:**
  - `POST /v1/oauth2/token` — auth
  - `POST /v2/checkout/orders` — create order
  - `POST /v2/checkout/orders/{id}/capture` — capture payment
- **Sponsor tool:** AG Grid Community (product comparison table)

## Getting started

### Prerequisites

- Node.js 20+ (LTS recommended)
- A **PayPal Developer** account (free) — [developer.paypal.com](https://developer.paypal.com)
- A **Groq** account (free) — [console.groq.com](https://console.groq.com)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd agentic-commerce-copilot
npm install
```

### 2. Set up environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Then fill in the values:

| Variable | Where to get it |
|---|---|
| `PAYPAL_CLIENT_ID` | [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/applications/sandbox) → Sandbox → Create App |
| `PAYPAL_CLIENT_SECRET` | Same page, click "Show" on Secret key 1 |
| `PAYPAL_BASE_URL` | Leave as `https://api-m.sandbox.paypal.com` for sandbox |
| `GROQ_API_KEY` | [console.groq.com/keys](https://console.groq.com/keys) |
| `APP_URL` | `http://localhost:3000` for local dev |

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Test a purchase

You'll need a **PayPal sandbox buyer account** to approve test payments:

1. Go to [developer.paypal.com](https://developer.paypal.com) → **Testing Tools** → **Sandbox Accounts**
2. Copy the email + password of a **Personal** account (create one if needed)
3. In the app, ask: `Find me an eco-friendly gift under $50`
4. Click **Buy with PayPal** on the recommended product
5. On the PayPal sandbox page, log in with the **buyer** credentials and approve
6. You'll land on a receipt page with the captured payment

## Project structure

```
agentic-commerce-copilot/
├── app/
│   ├── page.tsx                  # Chat UI + Cards/Table toggle
│   ├── success/page.tsx          # Receipt + product recap
│   ├── cancel/page.tsx           # Cancelled checkout
│   └── api/
│       ├── chat/route.ts         # AI: parse + recommend
│       └── paypal/
│           ├── create/route.ts   # Create order
│           └── capture/route.ts  # Capture order
├── components/
│   └── ProductTable.tsx          # AG Grid comparison table
├── lib/
│   ├── paypal.ts                 # PayPal REST helpers
│   └── products.ts               # Catalog search
├── data/
│   └── products.json             # 15 mock products
└── public/products/              # Product images
```

## Notes and limitations

- **Sandbox only.** No real money moves. The `PAYPAL_BASE_URL` points at `api-m.sandbox.paypal.com`.
- **Mock catalog.** The 15 products in `data/products.json` are fictional. Images are curated Pexels placeholders, not real product photos.
- **Free-tier AI.** Groq's free tier has an 8,000-tokens-per-minute limit. Heavy use will hit rate limits.
- **No persistence.** Orders are not stored. Each run is independent.

## License

MIT — see [LICENSE](./LICENSE).

Built by Antony Wairia Kamau for the PayPal AI Hackathon.