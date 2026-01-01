import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createBillingPortalSession } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Sign in to manage subscription' },
        { status: 401 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const returnUrl = `${appUrl}/account`;

    const portalUrl = await createBillingPortalSession(session.user.id, returnUrl);

    return NextResponse.json({ url: portalUrl });
  } catch (error) {
    console.error('Error creating billing portal session:', error);
    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 }
    );
  }
}
