# What Comes Next?

A daily number sequence puzzle game inspired by Wordle. Players analyze number patterns and guess the next value in the sequence.

## Features

- **Daily Puzzles**: A new puzzle every day at midnight Melbourne time
- **5 Attempts**: Guess the next number with 5 attempts
- **Progressive Reveals**: Wrong guesses reveal additional sequences that follow the same rule
- **2 Hints**: Nudges to help without giving away the answer
- **Scratchpad**: Built-in working area for calculations
- **Streaks**: Track consecutive days of solving
- **Archive Access**: Subscribers can play past puzzles
- **Practice Mode**: Unlimited practice puzzles for subscribers

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Database**: Prisma ORM (SQLite for dev, Postgres for production)
- **Auth**: NextAuth.js with email magic links
- **Payments**: Stripe subscriptions ($3/month)
- **AI**: OpenRouter for puzzle generation
- **Styling**: Tailwind CSS
- **State**: Zustand for client state
- **Testing**: Vitest

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- SQLite (for development) or PostgreSQL (for production)
- Stripe account
- OpenRouter API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd what-comes-next
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure your `.env` file with:
   - Database URL
   - NextAuth secret (generate with `openssl rand -base64 32`)
   - OpenRouter API key
   - Stripe keys
   - Admin email addresses

5. Set up the database:
```bash
npm run db:push
```

6. Seed initial puzzles:
```bash
npm run db:seed
```

7. Start the development server:
```bash
npm run dev
```

Visit `http://localhost:3000` to play!

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Database connection string |
| `NEXTAUTH_URL` | Your app's URL |
| `NEXTAUTH_SECRET` | Random secret for JWT encryption |
| `OPENROUTER_API_KEY` | OpenRouter API key for puzzle generation |
| `OPENROUTER_MODEL` | Model to use (default: `anthropic/claude-3.5-sonnet`) |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_PRICE_ID` | Stripe price ID for subscription |
| `ADMIN_EMAILS` | Comma-separated list of admin email addresses |
| `EMAIL_SERVER_*` | Email server configuration for magic links |
| `CRON_SECRET` | Secret for authenticating cron jobs |

## Stripe Setup

1. Create a Stripe account at https://stripe.com

2. Create a product and price:
   - Product: "What Comes Next? Premium"
   - Price: $3/month recurring

3. Get your API keys from the Stripe Dashboard

4. Set up the webhook:
   - Endpoint URL: `https://your-domain.com/api/stripe/webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`

5. For local testing, use Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Daily Puzzle Generation

### Vercel Cron (Recommended for Vercel deployment)

The `vercel.json` is pre-configured to run the puzzle generator at 13:00 UTC (midnight Melbourne AEDT):

```json
{
  "crons": [{
    "path": "/api/cron/generate-daily",
    "schedule": "0 13 * * *"
  }]
}
```

Set `CRON_SECRET` in your Vercel environment variables.

### Manual Generation

```bash
npm run generate-puzzle
# Or for a specific date:
npm run generate-puzzle 2024-01-15
```

### Self-hosted Cron

Add to your crontab:
```bash
# At midnight Melbourne time (adjust for your server timezone)
0 13 * * * curl -X POST https://your-domain.com/api/cron/generate-daily -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Admin Endpoints

Protected by `ADMIN_EMAILS` environment variable:

- `POST /api/admin/generate/{dateKey}` - Generate puzzle for a date
- `POST /api/admin/regenerate/{dateKey}` - Regenerate existing puzzle

## Puzzle Generation

### Rule Program Types

The game supports 14 deterministic rule types:

1. **ARITHMETIC_SEQUENCE** - Constant difference (e.g., 2, 5, 8, 11...)
2. **GEOMETRIC_SEQUENCE** - Constant ratio (e.g., 2, 6, 18, 54...)
3. **LINEAR_DIFF** - Linearly increasing differences
4. **SECOND_ORDER_CONSTANT** - Constant second differences
5. **ALTERNATING_OPS** - Alternating operations (+a, ×b, +a, ×b...)
6. **ALTERNATING_PARITY** - Different rules for odd/even positions
7. **POSITIONAL_FORMULA** - Quadratic: an² + bn + c
8. **CUBIC_POSITIONAL** - Cubic formula
9. **RECURSIVE_LINEAR** - next = a×prev + b
10. **FIBONACCI_LIKE** - next = a×prev + b×prev₂
11. **TRIBONACCI_LIKE** - next = prev + prev₂ + prev₃
12. **DIGIT_SUM_BASED** - Involves digit sums
13. **MULTIPLY_THEN_ADD** - next = prev × a + b
14. **POWER_BASED** - Power patterns (n², 2ⁿ, etc.)

### Validation Pipeline

Each generated puzzle goes through:

1. **Structural validation** - Bounds checking, length verification
2. **Difficulty validation** - Ensures puzzles aren't trivial
3. **Ambiguity checks** - Rejects puzzles with multiple valid interpretations

If AI generation fails after 20 attempts, fallback puzzles are used.

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test evaluators
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── puzzle/        # Puzzle endpoints
│   │   ├── guess/         # Guess submission
│   │   ├── hint/          # Hint requests
│   │   ├── stripe/        # Stripe webhooks
│   │   ├── cron/          # Daily generation
│   │   └── admin/         # Admin endpoints
│   ├── auth/              # Auth pages
│   ├── archive/           # Archive page
│   ├── practice/          # Practice mode
│   ├── account/           # Account management
│   └── puzzle/[dateKey]/  # Individual puzzle pages
├── components/            # React components
├── lib/                   # Core logic
│   ├── rules/            # Rule engine & validation
│   ├── auth.ts           # NextAuth config
│   ├── db.ts             # Prisma client
│   ├── stripe.ts         # Stripe utilities
│   ├── openrouter.ts     # AI integration
│   └── puzzle-generator.ts
├── store/                 # Zustand stores
└── types/                 # TypeScript types
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Self-hosted

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

3. Set up a process manager (PM2, systemd)
4. Configure reverse proxy (nginx)
5. Set up SSL certificates
6. Configure cron job for daily generation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

MIT
