import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createCheckoutSession } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_ID) {
      return NextResponse.json(
        { error: 'Payments are not configured yet. Please check back soon!' },
        { status: 503 }
      );
    }

    const session = await getSession();

    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json(
        { error: 'Sign in to subscribe' },
        { status: 401 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const successUrl = `${appUrl}/account?success=true`;
    const cancelUrl = `${appUrl}/account?canceled=true`;

    const checkoutUrl = await createCheckoutSession(
      session.user.id,
      session.user.email,
      successUrl,
      cancelUrl
    );

    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
