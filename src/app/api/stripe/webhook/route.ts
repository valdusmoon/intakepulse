import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { businesses } from "@/lib/db/schema/businesses";
import { getStripe, verifyWebhookSignature } from "@/lib/stripe";
import { releaseNumber } from "@/lib/twilio/client";
import { sendDunningEmail, sendReceiptEmail } from "@/lib/email/notifications";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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

        const businessId = session.metadata?.businessId || subscription.metadata?.businessId;
        if (!businessId) {
          console.error("No businessId in checkout session metadata:", session.id);
          break;
        }

        const priceId = subscription.items?.data?.[0]?.price?.id;
        const periodStart = subscription.current_period_start || subscription.trial_start;
        const periodEnd = subscription.current_period_end || subscription.trial_end;

        await db.update(businesses).set({
          stripeSubscriptionId: subscriptionId,
          stripePriceId: priceId ?? null,
          subscriptionStatus: subscription.status,
          trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
          currentPeriodStart: periodStart ? new Date(periodStart * 1000) : null,
          currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
          updatedAt: new Date(),
        }).where(eq(businesses.id, businessId));

        console.log(`Subscription created for company ${businessId}: ${subscription.status}`);
        break;
      }

      case "customer.subscription.updated": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subscription = event.data.object as any;
        let businessId = subscription.metadata?.businessId;

        if (!businessId) {
          const existing = await db.query.businesses.findFirst({
            where: eq(businesses.stripeSubscriptionId, subscription.id),
          }) ?? await db.query.businesses.findFirst({
            where: eq(businesses.stripeCustomerId, subscription.customer as string),
          });
          businessId = existing?.id;
        }

        if (!businessId) {
          console.error("No businessId for subscription:", subscription.id);
          break;
        }

        const priceId = subscription.items?.data?.[0]?.price?.id;
        const periodStart = subscription.current_period_start || subscription.trial_start;
        const periodEnd = subscription.current_period_end || subscription.trial_end;

        await db.update(businesses).set({
          subscriptionStatus: subscription.status,
          stripePriceId: priceId ?? undefined,
          currentPeriodStart: periodStart ? new Date(periodStart * 1000) : null,
          currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
          trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
          canceledAt: subscription.cancel_at_period_end
            ? new Date((subscription.current_period_end || subscription.trial_end) * 1000)
            : null,
          updatedAt: new Date(),
        }).where(eq(businesses.id, businessId));

        console.log(`Subscription updated for company ${businessId}: ${subscription.status}`);
        break;
      }

      case "customer.subscription.deleted": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subscription = event.data.object as any;

        // Fetch the full business row — we need its Twilio SID to release the number.
        let business = subscription.metadata?.businessId
          ? await db.query.businesses.findFirst({ where: eq(businesses.id, subscription.metadata.businessId) })
          : null;
        if (!business) {
          business = await db.query.businesses.findFirst({
            where: eq(businesses.stripeSubscriptionId, subscription.id),
          }) ?? await db.query.businesses.findFirst({
            where: eq(businesses.stripeCustomerId, subscription.customer as string),
          }) ?? null;
        }

        if (!business) break;

        // This fires at period end — access is fully over (cancel-at-period-end
        // holds the sub live until then). Release the Twilio number so we stop
        // paying its ~$1/mo rental, and clear it from the business. If the release
        // call fails, leave the number attached rather than losing track of it.
        let numberFields: { twilioPhoneNumber?: null; twilioPhoneNumberSid?: null; numberPublished?: boolean } = {};
        if (business.twilioPhoneNumberSid) {
          try {
            await releaseNumber(business.twilioPhoneNumberSid);
            numberFields = { twilioPhoneNumber: null, twilioPhoneNumberSid: null, numberPublished: false };
            console.log(`Released Twilio number for business ${business.id}`);
          } catch (err) {
            console.error(`Failed to release Twilio number for business ${business.id}:`, err);
          }
        }

        await db.update(businesses).set({
          subscriptionStatus: "canceled",
          canceledAt: new Date(),
          ...numberFields,
          updatedAt: new Date(),
        }).where(eq(businesses.id, business.id));

        console.log(`Subscription canceled for business ${business.id}`);
        break;
      }

      case "invoice.payment_failed": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice = event.data.object as any;

        // Look up company by subscription ID first, then by customer ID
        const subscriptionId = invoice.subscription as string | null;
        const customerId = invoice.customer as string;

        let company = subscriptionId
          ? await db.query.businesses.findFirst({ where: eq(businesses.stripeSubscriptionId, subscriptionId) })
          : null;
        if (!company) {
          company = await db.query.businesses.findFirst({ where: eq(businesses.stripeCustomerId, customerId) });
        }

        if (company) {
          await db.update(businesses).set({
            subscriptionStatus: "past_due",
            updatedAt: new Date(),
          }).where(eq(businesses.id, company.id));
          console.log(`Payment failed for company ${company.id}, status set to past_due`);

          // Dunning email — fire-and-forget. Only reaches a real recipient once
          // Stripe is live (payment is mocked today, so this event never fires).
          void sendDunningEmail({
            ownerEmail: company.ownerEmail,
            ownerName: company.ownerName,
            businessName: company.businessName,
            billingUrl: `${APP_URL}/dashboard/billing`,
          }).catch(() => {});
        } else {
          console.error(`invoice.payment_failed: no company found for invoice ${invoice.id}`);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice = event.data.object as any;

        const subscriptionId = invoice.subscription as string | null;
        const customerId = invoice.customer as string;

        let company = subscriptionId
          ? await db.query.businesses.findFirst({ where: eq(businesses.stripeSubscriptionId, subscriptionId) })
          : null;
        if (!company) {
          company = await db.query.businesses.findFirst({ where: eq(businesses.stripeCustomerId, customerId) });
        }

        if (company) {
          // Receipt email — fire-and-forget. Only reaches a real recipient once
          // Stripe is live (payment is mocked today, so this event never fires).
          const periodEndUnix = invoice.lines?.data?.[0]?.period?.end as number | undefined;
          void sendReceiptEmail({
            ownerEmail: company.ownerEmail,
            ownerName: company.ownerName,
            businessName: company.businessName,
            amountCents: Number(invoice.amount_paid ?? 0),
            periodEnd: periodEndUnix ? new Date(periodEndUnix * 1000) : (company.currentPeriodEnd ?? null),
            billingUrl: `${APP_URL}/dashboard/billing`,
          }).catch(() => {});
        } else {
          console.error(`invoice.payment_succeeded: no company found for invoice ${invoice.id}`);
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
