import Stripe from 'stripe';
import { db } from './db';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

const MONTHLY_PRICE = 300; // $3.00 in cents

/**
 * Creates or retrieves a Stripe customer for a user.
 */
export async function getOrCreateStripeCustomer(userId: string, email: string): Promise<string> {
  // Check if user already has a subscription record with customer ID
  const existingSub = await db.subscription.findUnique({
    where: { userId },
  });

  if (existingSub?.stripeCustomerId) {
    return existingSub.stripeCustomerId;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });

  // Create or update subscription record
  await db.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeCustomerId: customer.id,
      status: 'inactive',
    },
    update: {
      stripeCustomerId: customer.id,
    },
  });

  return customer.id;
}

/**
 * Creates a Stripe checkout session for subscription.
 */
export async function createCheckoutSession(
  userId: string,
  email: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const customerId = await getOrCreateStripeCustomer(userId, email);
  const priceId = process.env.STRIPE_PRICE_ID;

  if (!priceId) {
    throw new Error('STRIPE_PRICE_ID is not configured');
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId },
  });

  if (!session.url) {
    throw new Error('Failed to create checkout session');
  }

  return session.url;
}

/**
 * Creates a Stripe billing portal session.
 */
export async function createBillingPortalSession(
  userId: string,
  returnUrl: string
): Promise<string> {
  const subscription = await db.subscription.findUnique({
    where: { userId },
  });

  if (!subscription?.stripeCustomerId) {
    throw new Error('No subscription found for user');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: returnUrl,
  });

  return session.url;
}

/**
 * Handles Stripe webhook events.
 */
export async function handleStripeWebhook(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const subscriptionId = session.subscription as string;

      if (userId && subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await db.subscription.update({
          where: { userId },
          data: {
            stripeSubscriptionId: subscriptionId,
            status: subscription.status,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
        });
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      const sub = await db.subscription.findUnique({
        where: { stripeCustomerId: customerId },
      });

      if (sub) {
        await db.subscription.update({
          where: { stripeCustomerId: customerId },
          data: {
            status: subscription.status,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
        });
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      await db.subscription.updateMany({
        where: { stripeCustomerId: customerId },
        data: {
          status: 'canceled',
          stripeSubscriptionId: null,
        },
      });
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      await db.subscription.updateMany({
        where: { stripeCustomerId: customerId },
        data: { status: 'past_due' },
      });
      break;
    }

    default:
      console.log(`Unhandled Stripe event: ${event.type}`);
  }
}

/**
 * Checks if a user has an active subscription.
 */
export async function checkSubscriptionStatus(userId: string): Promise<{
  isActive: boolean;
  status: string;
  expiresAt: Date | null;
}> {
  const subscription = await db.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    return { isActive: false, status: 'none', expiresAt: null };
  }

  const isActive =
    subscription.status === 'active' &&
    subscription.currentPeriodEnd !== null &&
    subscription.currentPeriodEnd > new Date();

  return {
    isActive,
    status: subscription.status,
    expiresAt: subscription.currentPeriodEnd,
  };
}
