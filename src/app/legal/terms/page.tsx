export const metadata = {
  title: "Terms of Service — Callverted",
  description: "Terms and conditions for using the Callverted platform.",
};

export default function TermsOfServicePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Terms of Service</h1>
        <p className="text-sm text-gray-400">Last updated: July 9, 2026</p>
      </div>

      <p className="text-gray-600 leading-relaxed">
        These Terms of Service govern your use of Callverted ("Service"), operated by Callverted ("we", "us", "our").
        Callverted provides an AI voice-overflow receptionist and lead-capture platform for home-service businesses;
        "you" refers to the business entity or individual that creates a Callverted account. By accessing or using
        the Service, you agree to these terms. If you do not agree, do not use the Service.
      </p>

      <Section title="1. Description of Service">
        <p>
          Callverted answers phone calls on behalf of home-service businesses — in water/fire/mold restoration,
          HVAC, plumbing, electrical, general contracting, or other home-service trades — when your team misses a
          call, or on every call if you configure immediate AI answering. The AI asks each caller a short set of
          intake questions specific to your trade and produces a scored lead: an urgency score, a quality score, an
          estimated job-value range, and written reasoning, delivered to you by email and shown in your dashboard.
          The same intake questions are also available as a standalone public web form and an embeddable website
          widget, so leads can reach you by phone, form, or widget using the same qualification logic. You configure
          your own pricing guidance per service category in Settings; the AI reads back only the price ranges and
          messages you've approved — it does not create quotes, contracts, or estimates on its own, and it does not
          negotiate price. The Service does not provide staff scheduling, contract generation, electronic
          signatures, photo analysis, or automated review requests. The Service is intended for use by home-service
          businesses, not by individual consumers.
        </p>
      </Section>

      <Section title="2. Account Registration">
        <p>
          You must create an account to use Callverted. You agree to provide accurate, complete information —
          including your business name, your name, email address, phone number, and service area — and to keep it
          updated. You are responsible for all activity under your account and for maintaining the security
          of your credentials. Notify us immediately at{" "}
          <a href="mailto:hello@callverted.com">hello@callverted.com</a> if you suspect unauthorized access.
        </p>
        <p>
          You must be at least 18 years old and legally capable of entering into a binding contract to use the Service.
        </p>
      </Section>

      <Section title="3. Subscription and Billing">
        <p>
          Callverted is offered as a paid subscription at $149/month. A 14-day free trial is available to new accounts.
          Payment method is collected upfront through Stripe Checkout, but no charge is made during the trial
          period. By starting a trial, you authorize us to charge your payment method at the end of the trial unless
          you cancel first.
        </p>
        <p>
          Subscriptions renew automatically each month until canceled. You may cancel at any time through your billing
          settings. Access continues until the end of the current billing period — there are no partial refunds for
          unused time. See our <a href="/legal/refunds">Refund Policy</a> for exceptions.
        </p>
        <p>
          Payments are processed by Stripe. We do not store your payment card information. Prices are in USD and may
          be updated with 30 days notice.
        </p>
      </Section>

      <Section title="4. Acceptable Use">
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service for any unlawful purpose or in violation of applicable laws</li>
          <li>Use the Service to send unsolicited or misleading communications to callers or leads</li>
          <li>Attempt to reverse engineer, scrape, or copy the Service</li>
          <li>Interfere with or disrupt the integrity or performance of the Service</li>
          <li>Use the Service to misrepresent your business, pricing, or qualifications to callers</li>
          <li>Enable call recording without providing the notice or consent required by the laws of your jurisdiction</li>
          <li>Share your account credentials or resell access to the Service</li>
        </ul>
      </Section>

      <Section title="5. AI Voice, Scoring, and Pricing Guidance">
        <p>
          Callverted uses OpenAI's models to hold the voice conversation with callers and to generate, from the
          intake answers, an urgency score, a quality score, an estimated job-value range, and written reasoning for
          each lead. Any pricing information the AI shares with a caller is limited to the ranges and messages you
          configure in Settings — the AI does not invent figures, negotiate, or commit you to a price.
        </p>
        <p>You acknowledge that:</p>
        <ul>
          <li>AI-generated scores, summaries, transcripts, and estimated job-value ranges are approximations meant to help you triage leads, not guarantees</li>
          <li>You are solely responsible for the actual quotes, prices, and contracts you provide to your customers</li>
          <li>Callverted is not liable for any disputes arising from AI-generated scoring, transcripts, or the pricing guidance you configure</li>
        </ul>
      </Section>

      <Section title="6. Call Recording">
        <p>
          Call recording is an optional, business-configurable feature. If you enable it, Callverted plays a spoken
          disclosure you provide at the start of the call. You are solely responsible for ensuring your disclosure
          language and use of call recording complies with the wiretapping and recording-consent laws of every
          jurisdiction in which you or your callers are located, including obtaining any required consent.
        </p>
      </Section>

      <Section title="7. Caller and Lead Data">
        <p>
          Data collected from your callers and leads — including their contact information, intake answers, and
          call recordings or transcripts where applicable — is associated with your account. You agree to handle
          this data responsibly, in compliance with applicable privacy and telemarketing laws, and only for
          legitimate business purposes related to responding to their inquiry. You may not use caller or lead data
          for unrelated marketing or share it with third parties outside the ordinary operation of your business.
        </p>
      </Section>

      <Section title="8. Intellectual Property">
        <p>
          Callverted and its original content, features, and functionality are owned by us and are protected by
          applicable intellectual property laws. You retain ownership of the content you provide (your pricing
          rules, greeting script, AI instructions, and similar configuration) and grant us a limited license to
          store and process it to provide the Service.
        </p>
      </Section>

      <Section title="9. Termination">
        <p>
          You may cancel your account at any time through your billing settings. We reserve the right to suspend
          or terminate accounts that violate these terms, engage in fraudulent activity, or pose a risk to other
          users or the Service. In the event of termination for cause, no refund will be provided.
        </p>
        <p>
          Upon termination, your right to access the Service ends. We will retain your data for 90 days before
          deletion, during which time you may request an export.
        </p>
      </Section>

      <Section title="10. Disclaimer of Warranties">
        <p>
          The Service is provided "as is" and "as available" without warranties of any kind, express or implied,
          including but not limited to merchantability, fitness for a particular purpose, or non-infringement.
          We do not warrant that the Service will be uninterrupted, error-free, or that AI-generated scores,
          transcripts, or summaries will meet any particular accuracy standard.
        </p>
      </Section>

      <Section title="11. Limitation of Liability">
        <p>
          To the maximum extent permitted by law, Callverted and its owners shall not be liable for any indirect,
          incidental, special, consequential, or punitive damages — including lost profits, lost revenue, or lost
          business — arising from your use of or inability to use the Service, even if we have been advised of
          the possibility of such damages.
        </p>
        <p>
          Our total liability to you for any claim arising from the Service shall not exceed the amount you paid
          us in the 3 months preceding the claim.
        </p>
      </Section>

      <Section title="12. Changes to Terms">
        <p>
          We may update these terms from time to time. We will notify you of material changes by email or through
          an in-app notice at least 14 days before they take effect. Continued use of the Service after changes
          take effect constitutes acceptance of the updated terms.
        </p>
      </Section>

      <Section title="13. Governing Law">
        <p>
          These terms are governed by the laws of the United States. Any disputes shall be resolved through
          binding arbitration or in the courts of competent jurisdiction, and you waive any right to a jury trial.
        </p>
      </Section>

      <Section title="14. Contact">
        <p>
          For questions about these terms, contact us at{" "}
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
