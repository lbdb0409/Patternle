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
 * Handles Stripe webhook events with robust error handling.
 */
export async function handleStripeWebhook(event: Stripe.Event): Promise<void> {
  console.log(`Processing Stripe webhook: ${event.type}`);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const subscriptionId = session.subscription as string;
      const customerId = session.customer as string;

      console.log(`Checkout completed - userId: ${userId}, subscriptionId: ${subscriptionId}, customerId: ${customerId}`);

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        // Try to update by userId first
        if (userId) {
          try {
            await db.subscription.upsert({
              where: { userId },
              create: {
                userId,
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
                status: subscription.status,
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
              },
              update: {
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
                status: subscription.status,
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
              },
            });
            console.log(`Subscription record updated for userId: ${userId}`);
          } catch (error) {
            console.error(`Failed to update subscription for userId ${userId}:`, error);
            throw error;
          }
        } else if (customerId) {
          // Fallback: try to find by customer ID
          try {
            const existing = await db.subscription.findUnique({
              where: { stripeCustomerId: customerId },
            });

            if (existing) {
              await db.subscription.update({
                where: { stripeCustomerId: customerId },
                data: {
                  stripeSubscriptionId: subscriptionId,
                  status: subscription.status,
                  currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                  cancelAtPeriodEnd: subscription.cancel_at_period_end,
                },
              });
              console.log(`Subscription record updated for customerId: ${customerId}`);
            } else {
              console.warn(`No subscription record found for customerId: ${customerId}`);
            }
          } catch (error) {
            console.error(`Failed to update subscription for customerId ${customerId}:`, error);
            throw error;
          }
        }
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      console.log(`Subscription updated - customerId: ${customerId}, status: ${subscription.status}`);

      try {
        const result = await db.subscription.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            stripeSubscriptionId: subscription.id,
            status: subscription.status,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
        });

        if (result.count === 0) {
          console.warn(`No subscription record found to update for customerId: ${customerId}`);
        } else {
          console.log(`Updated ${result.count} subscription record(s) for customerId: ${customerId}`);
        }
      } catch (error) {
        console.error(`Failed to update subscription for customerId ${customerId}:`, error);
        throw error;
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      console.log(`Subscription deleted - customerId: ${customerId}`);

      try {
        await db.subscription.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            status: 'canceled',
            stripeSubscriptionId: null,
          },
        });
        console.log(`Marked subscription as canceled for customerId: ${customerId}`);
      } catch (error) {
        console.error(`Failed to cancel subscription for customerId ${customerId}:`, error);
        throw error;
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      console.log(`Payment failed - customerId: ${customerId}`);

      try {
        await db.subscription.updateMany({
          where: { stripeCustomerId: customerId },
          data: { status: 'past_due' },
        });
      } catch (error) {
        console.error(`Failed to mark subscription as past_due for customerId ${customerId}:`, error);
        throw error;
      }
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
