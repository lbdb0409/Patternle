import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';

/**
 * Manually sync subscription status from Stripe.
 * Use this as a fallback if webhooks fail.
 */
export async function POST() {
  try {
    const session = await getSession();

    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json(
        { error: 'Sign in to sync subscription' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const email = session.user.email;

    // Find or create subscription record
    let subscription = await db.subscription.findUnique({
      where: { userId },
    });

    // Try to find Stripe customer by email if we don't have a customer ID
    let stripeCustomerId = subscription?.stripeCustomerId;

    if (!stripeCustomerId) {
      // Search for customer by email
      const customers = await stripe.customers.list({
        email,
        limit: 1,
      });

      if (customers.data.length > 0) {
        stripeCustomerId = customers.data[0].id;

        // Create/update subscription record with customer ID
        subscription = await db.subscription.upsert({
          where: { userId },
          create: {
            userId,
            stripeCustomerId,
            status: 'inactive',
          },
          update: {
            stripeCustomerId,
          },
        });
      }
    }

    if (!stripeCustomerId) {
      return NextResponse.json({
        success: true,
        message: 'No Stripe customer found for this account',
        isSubscribed: false,
      });
    }

    // Get active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      // No active subscription - update DB
      await db.subscription.update({
        where: { userId },
        data: {
          status: 'inactive',
          stripeSubscriptionId: null,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'No active subscription found',
        isSubscribed: false,
      });
    }

    // Found active subscription - sync to DB
    const stripeSub = subscriptions.data[0];

    await db.subscription.update({
      where: { userId },
      data: {
        stripeSubscriptionId: stripeSub.id,
        status: stripeSub.status,
        currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription synced successfully',
      isSubscribed: true,
      expiresAt: new Date(stripeSub.current_period_end * 1000),
    });
  } catch (error) {
    console.error('Subscription sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync subscription' },
      { status: 500 }
    );
  }
}
