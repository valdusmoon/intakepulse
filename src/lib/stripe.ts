import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

// Lazy init — only throws when actually used, not at import time
export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2025-08-27.basil",
      typescript: true,
    })
  : null;

export const getStripe = (): Stripe => {
  if (!stripe) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Please add it to your .env.local file."
    );
  }
  return stripe;
};

export const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

/**
 * Create a Stripe customer for a new user
 */
export async function createStripeCustomer(params: {
  companyId: string;
  email?: string;
  name?: string;
}): Promise<Stripe.Customer> {
  const s = getStripe();
  const customer = await s.customers.create({
    email: params.email,
    name: params.name,
    metadata: { companyId: params.companyId },
  });
  return customer;
}

/**
 * Create a Stripe Checkout session for a subscription
 */
export async function createSubscriptionCheckout(params: {
  customerId: string;
  priceId: string;
  companyId: string;
  successUrl: string;
  cancelUrl: string;
  trialPeriodDays?: number;
}): Promise<Stripe.Checkout.Session> {
  const s = getStripe();
  const session = await s.checkout.sessions.create({
    customer: params.customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: params.priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: params.trialPeriodDays ?? 14,
      metadata: { companyId: params.companyId },
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: { companyId: params.companyId },
  });
  return session;
}

/**
 * Get or create a billing portal configuration.
 * Reuses the first existing configuration so we don't create duplicates on every call.
 * Configuration enforces cancel-at-period-end so users keep access until billing period ends.
 */
async function getOrCreatePortalConfiguration(s: Stripe): Promise<string> {
  const existing = await s.billingPortal.configurations.list({ limit: 1, active: true });
  if (existing.data.length > 0) return existing.data[0].id;

  const config = await s.billingPortal.configurations.create({
    business_profile: {
      headline: "Manage your CraftCapture subscription",
    },
    features: {
      subscription_cancel: {
        enabled: true,
        mode: "at_period_end",
        cancellation_reason: {
          enabled: true,
          options: ["too_expensive", "missing_features", "switched_service", "unused", "other"],
        },
      },
      payment_method_update: { enabled: true },
      invoice_history: { enabled: true },
    },
  });
  return config.id;
}

/**
 * Create a Stripe Billing Portal session for managing subscriptions.
 * Uses a configured portal that cancels at period end (user keeps access until billing period ends).
 */
export async function createCustomerPortalSession(params: {
  customerId: string;
  returnUrl: string;
}): Promise<Stripe.BillingPortal.Session> {
  const s = getStripe();
  const configurationId = await getOrCreatePortalConfiguration(s);
  const session = await s.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
    configuration: configurationId,
  });
  return session;
}

/**
 * Cancel a subscription at the end of the current billing period
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const s = getStripe();
  return s.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
}

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  body: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  const s = getStripe();
  return s.webhooks.constructEvent(body, signature, secret);
}
