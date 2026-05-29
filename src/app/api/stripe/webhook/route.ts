import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { companies } from "@/lib/db/schema/companies";
import { getStripe, verifyWebhookSignature } from "@/lib/stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature")!;

    let event: Stripe.Event;
    try {
      event = verifyWebhookSignature(body, signature, webhookSecret);
    } catch {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId = session.subscription as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subscription: any = await getStripe().subscriptions.retrieve(subscriptionId);

        const companyId = session.metadata?.companyId || subscription.metadata?.companyId;
        if (!companyId) {
          console.error("No companyId in checkout session metadata:", session.id);
          break;
        }

        const priceId = subscription.items?.data?.[0]?.price?.id;
        const periodStart = subscription.current_period_start || subscription.trial_start;
        const periodEnd = subscription.current_period_end || subscription.trial_end;

        await db.update(companies).set({
          stripeSubscriptionId: subscriptionId,
          stripePriceId: priceId ?? null,
          subscriptionStatus: subscription.status,
          trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
          currentPeriodStart: periodStart ? new Date(periodStart * 1000) : null,
          currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
          updatedAt: new Date(),
        }).where(eq(companies.id, companyId));

        console.log(`Subscription created for company ${companyId}: ${subscription.status}`);
        break;
      }

      case "customer.subscription.updated": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subscription = event.data.object as any;
        let companyId = subscription.metadata?.companyId;

        if (!companyId) {
          const existing = await db.query.companies.findFirst({
            where: eq(companies.stripeSubscriptionId, subscription.id),
          }) ?? await db.query.companies.findFirst({
            where: eq(companies.stripeCustomerId, subscription.customer as string),
          });
          companyId = existing?.id;
        }

        if (!companyId) {
          console.error("No companyId for subscription:", subscription.id);
          break;
        }

        const priceId = subscription.items?.data?.[0]?.price?.id;
        const periodStart = subscription.current_period_start || subscription.trial_start;
        const periodEnd = subscription.current_period_end || subscription.trial_end;

        await db.update(companies).set({
          subscriptionStatus: subscription.status,
          stripePriceId: priceId ?? undefined,
          currentPeriodStart: periodStart ? new Date(periodStart * 1000) : null,
          currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
          trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
          canceledAt: subscription.cancel_at_period_end
            ? new Date((subscription.current_period_end || subscription.trial_end) * 1000)
            : null,
          updatedAt: new Date(),
        }).where(eq(companies.id, companyId));

        console.log(`Subscription updated for company ${companyId}: ${subscription.status}`);
        break;
      }

      case "customer.subscription.deleted": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subscription = event.data.object as any;
        let companyId = subscription.metadata?.companyId;

        if (!companyId) {
          const existing = await db.query.companies.findFirst({
            where: eq(companies.stripeSubscriptionId, subscription.id),
          }) ?? await db.query.companies.findFirst({
            where: eq(companies.stripeCustomerId, subscription.customer as string),
          });
          companyId = existing?.id;
        }

        if (!companyId) break;

        await db.update(companies).set({
          subscriptionStatus: "canceled",
          canceledAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(companies.id, companyId));

        console.log(`Subscription canceled for company ${companyId}`);
        break;
      }

      case "invoice.payment_failed": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice = event.data.object as any;

        // Look up company by subscription ID first, then by customer ID
        const subscriptionId = invoice.subscription as string | null;
        const customerId = invoice.customer as string;

        let company = subscriptionId
          ? await db.query.companies.findFirst({ where: eq(companies.stripeSubscriptionId, subscriptionId) })
          : null;
        if (!company) {
          company = await db.query.companies.findFirst({ where: eq(companies.stripeCustomerId, customerId) });
        }

        if (company) {
          await db.update(companies).set({
            subscriptionStatus: "past_due",
            updatedAt: new Date(),
          }).where(eq(companies.id, company.id));
          console.log(`Payment failed for company ${company.id}, status set to past_due`);
        } else {
          console.error(`invoice.payment_failed: no company found for invoice ${invoice.id}`);
        }
        break;
      }

      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
