export const metadata = {
  title: "Refund Policy — Callverted",
  description: "Callverted's refund and cancellation policy.",
};

export default function RefundPolicyPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Refund Policy</h1>
        <p className="text-sm text-gray-400">Last updated: April 2, 2026</p>
      </div>

      <p className="text-gray-600 leading-relaxed">
        We want you to feel confident using Callverted. This policy explains how cancellations and refunds work.
      </p>

      <Section title="Free Trial">
        <p>
          All new accounts receive a 14-day free trial. No charge is made during the trial period. You may cancel
          at any time before the trial ends and you will not be billed. After day 14, your subscription starts at
          $79/month and renews automatically.
        </p>
      </Section>

      <Section title="Cancellations">
        <p>
          You can cancel your subscription at any time from your billing settings — no phone calls, no forms,
          no retention pressure. Your account remains active until the end of the current billing period.
          After that, your account is downgraded and you lose access to subscription features.
        </p>
        <p>
          Your existing lead data remains accessible for 90 days after cancellation, after which it is deleted.
        </p>
      </Section>

      <Section title="Refunds">
        <p>
          We generally do not offer refunds for subscription charges once a billing period has begun, as access
          to the full Service is granted immediately.
        </p>
        <p>Refunds are considered in the following situations:</p>
        <ul>
          <li><strong>Billing errors:</strong> If you were charged incorrectly (e.g., charged twice, wrong amount), we will refund the difference promptly.</li>
          <li><strong>Extended service outage:</strong> If the Service was unavailable for more than 24 consecutive hours due to issues on our end, you may request a prorated credit for the affected period.</li>
          <li><strong>Accidental renewal:</strong> If you forgot to cancel and were charged at the start of a new billing cycle without using the Service, contact us within 48 hours of the charge. We will review on a case-by-case basis.</li>
        </ul>
      </Section>

      <Section title="How to Request a Refund">
        <p>
          Email <a href="mailto:hello@callverted.com">hello@callverted.com</a> with the subject line "Refund Request"
          and include your account email and a brief description of the issue. We aim to respond within 1 business
          day.
        </p>
        <p>
          Approved refunds are processed within 5–10 business days and returned to the original payment method
          via Stripe.
        </p>
      </Section>

      <Section title="Questions">
        <p>
          If you have any questions about billing or this policy, reach out at{" "}
          <a href="mailto:hello@callverted.com">hello@callverted.com</a>.
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <div className="text-gray-600 leading-relaxed space-y-2 [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:space-y-1.5 [&_a]:text-orange-500 [&_a:hover]:underline">
        {children}
      </div>
    </section>
  );
}
