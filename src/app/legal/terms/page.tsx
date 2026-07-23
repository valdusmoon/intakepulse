export const metadata = {
  title: "Terms of Service — Callverted",
  description: "Terms and conditions for using the Callverted platform.",
};

export default function TermsOfServicePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Terms of Service</h1>
        <p className="text-sm text-gray-400">Last updated: July 23, 2026</p>
      </div>

      <p className="text-gray-600 leading-relaxed">
        These Terms of Service govern your use of Callverted ("Service"), operated by Callverted ("we", "us",
        "our"). Callverted is an inbound lead capture and callback-ranking platform for home-service businesses.
        "You" refers to the business entity or individual that creates a Callverted account. By accessing or using
        the Service, you agree to these terms. If you do not agree, do not use the Service.
      </p>

      <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 text-sm text-gray-600 leading-relaxed">
        These terms describe the deal between you and Callverted. They are not legal advice about your own
        obligations to your customers, employees, or callers. For that, talk to a lawyer.
      </div>

      <Section title="1. Description of Service">
        <p>
          Callverted captures inbound contacts for home-service businesses in restoration, HVAC, plumbing,
          electrical, general contracting, and similar trades. Inbound calls ring your own line first. If nobody
          picks up, an AI assistant answers instead, and you can also configure it to answer every call
          immediately. The same intake also runs as a public web form and an embeddable website widget.
        </p>
        <p>
          Each captured contact becomes exactly one record, sorted into one of three outcomes: a <strong>job</strong>{" "}
          (scored for urgency, quality, and priority, with a backend job-value estimate and written reasoning, and
          placed in a ranked callback queue), a <strong>message</strong> (captured and flagged but never scored or
          ranked), or <strong>junk</strong> such as a wrong number or a solicitation, which is screened out with no
          lead created. You are alerted by web push and email. The Service does not send SMS.
        </p>
        <p>
          The AI asks a short, fixed set of intake questions: what the problem is, how urgent it is, and the ZIP
          code, plus timing and coverage if the caller volunteers them. It reads back only the price wording you
          have approved in Settings, and says the team will review the details when you have approved none. It does
          not create quotes, contracts, or estimates on its own, does not negotiate, does not book appointments, and
          does not bridge calls to a human. If you turn on call recording, calls your own team answers are also
          transcribed and captured as leads.
        </p>
        <p>
          Callverted is not a CRM, an answering service, or a dispatch system. It does not provide staff
          scheduling, contract generation, electronic signatures, photo analysis, or automated review requests. It
          is intended for use by home-service businesses, not by individual consumers.
        </p>
      </Section>

      <Section title="2. Account Registration">
        <p>
          You must create an account to use Callverted. You agree to provide accurate, complete information,
          including your business name, your name, email address, phone number, and service area, and to keep it
          updated. You are responsible for all activity under your account and for the security of your
          credentials. Notify us immediately at{" "}
          <a href="mailto:hello@callverted.com">hello@callverted.com</a> if you suspect unauthorized access.
        </p>
        <p>
          You must be at least 18 years old and legally capable of entering into a binding contract to use the Service.
        </p>
      </Section>

      <Section title="3. Subscription and Billing">
        <p>
          Callverted is a single product with two billing options: <strong>$149 per month</strong>, or{" "}
          <strong>$1,499 per year</strong> billed upfront. Both include the same features. New accounts get a
          14-day free trial. A payment method is collected upfront through Stripe Checkout, but no charge is made
          during the trial. By starting a trial you authorize us to charge that payment method when the trial ends
          unless you cancel first.
        </p>
        <p>
          Subscriptions renew automatically until canceled. You may cancel at any time from your billing settings.
          Cancellation takes effect at the end of the period you have already paid for, and there are no partial
          refunds for unused time. See our <a href="/legal/refunds">Refund Policy</a> for the exceptions we do
          honor.
        </p>
        <p>
          Payments are processed by Stripe. We do not store your card details. Prices are in USD and may change
          with 30 days notice.
        </p>
        <p>
          Your live phone line only answers while you have an active subscription or an unexpired trial. If billing
          lapses, inbound calls stop being handled.
        </p>
      </Section>

      <Section title="4. Your Callverted Phone Number">
        <p>
          We provision a dedicated phone number to your account through our telephony provider. The number is
          licensed to you for use with the Service while your subscription is active. It is not sold to you, and it
          is not portable by default. When a subscription ends, the number is released back to the carrier and can
          be reassigned to someone else, so publish it knowing that access to it ends with your subscription. If
          you want to keep a number you have advertised widely, contact us before you cancel.
        </p>
      </Section>

      <Section title="5. Acceptable Use">
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service for any unlawful purpose or in violation of applicable laws</li>
          <li>Use the Service to send unsolicited or misleading communications to callers or leads</li>
          <li>Attempt to reverse engineer, scrape, or copy the Service</li>
          <li>Interfere with or disrupt the integrity or performance of the Service</li>
          <li>Use the Service to misrepresent your business, pricing, or qualifications to callers</li>
          <li>Enable call recording without a disclosure that meets the notice and consent laws of your jurisdiction</li>
          <li>Present the Service to callers as a substitute for 911 or any emergency service</li>
          <li>Share your account credentials or resell access to the Service</li>
        </ul>
      </Section>

      <Section title="6. AI Behavior, Scoring, and Pricing Guidance">
        <p>
          Callverted uses OpenAI models to hold the spoken conversation, transcribe audio, extract answers from
          what the caller said, classify the contact, and write summaries and score explanations. The scores
          themselves are computed by our code, not by the model. The model explains a number that was already
          decided.
        </p>
        <p>The model's authority is intentionally narrow. It speaks the lines it is given or picks from a fixed set of options. It never quotes a price you have not approved, never books an appointment, and never transfers a caller to a person.</p>
        <p>You acknowledge that:</p>
        <ul>
          <li>Scores, summaries, transcripts, and job-value estimates are approximations meant to help you triage, not guarantees</li>
          <li>Speech recognition can misread what a caller said, and a captured detail may be wrong</li>
          <li>The Service may miss or fail to capture a call, for example during a provider outage, and you should not rely on it as your only record of inbound contacts</li>
          <li>You are solely responsible for the actual quotes, prices, and contracts you give your customers</li>
          <li>Callverted is not liable for disputes arising from AI-generated scoring, transcripts, summaries, or the pricing wording you configure</li>
        </ul>
      </Section>

      <Section title="7. Call Recording and Disclosure">
        <p>
          Recording of calls your own team answers is optional and off by default. It only runs when you both
          enable it and write a spoken disclosure, and that disclosure is played to the caller before your team is
          dialed. Calls the AI answers are not recorded to a file at all: audio streams through for the length of
          the call so the assistant can hear and speak, and what is kept is the transcript and summary.
        </p>
        <p>
          In every case, Callverted keeps the written transcript and deletes the audio. We do not retain call audio
          for playback or storage.
        </p>
        <p>
          You are solely responsible for ensuring your disclosure wording and your use of recording comply with the
          wiretapping and recording-consent laws of every jurisdiction where you or your callers are located,
          including obtaining any consent those laws require.
        </p>
      </Section>

      <Section title="8. Caller and Lead Data">
        <p>
          You are the controller of the data your callers give you, and Callverted processes it on your behalf and
          on your instructions. You agree to handle that data responsibly, in compliance with applicable privacy
          and telemarketing laws, and only for legitimate business purposes related to responding to the inquiry.
          You may not use caller or lead data for unrelated marketing or share it with third parties outside the
          ordinary operation of your business.
        </p>
        <p>
          We do not sell caller data, do not use it for advertising, and do not share it with other businesses on
          the platform. See our <a href="/legal/privacy">Privacy Policy</a> for what we store and who processes it.
        </p>
      </Section>

      <Section title="9. Intellectual Property">
        <p>
          Callverted and its original content, features, and functionality are owned by us and protected by
          applicable intellectual property laws. You retain ownership of the content you provide, such as your
          pricing rules, greeting script, AI instructions, disclosure wording, and similar configuration, and you
          grant us a limited license to store and process it to provide the Service.
        </p>
      </Section>

      <Section title="10. Termination">
        <p>
          You may cancel at any time from your billing settings. We reserve the right to suspend or terminate
          accounts that violate these terms, engage in fraudulent activity, or pose a risk to other users or the
          Service. Where termination is for cause, no refund is provided.
        </p>
        <p>
          When access ends, your data is kept for at least 90 days so you can request an export, and we delete it
          on request. Export your leads and calls to CSV from the dashboard before you lose access if you want a
          copy in hand.
        </p>
      </Section>

      <Section title="11. Disclaimer of Warranties">
        <p>
          The Service is provided "as is" and "as available" without warranties of any kind, express or implied,
          including merchantability, fitness for a particular purpose, or non-infringement. We do not warrant that
          the Service will be uninterrupted or error-free, that every inbound contact will be captured, or that
          AI-generated scores, transcripts, or summaries will meet any particular accuracy standard.
        </p>
      </Section>

      <Section title="12. Limitation of Liability">
        <p>
          To the maximum extent permitted by law, Callverted and its owners are not liable for any indirect,
          incidental, special, consequential, or punitive damages, including lost profits, lost revenue, or lost
          business, arising from your use of or inability to use the Service, even if we have been advised of the
          possibility of such damages.
        </p>
        <p>
          Our total liability for any claim arising from the Service will not exceed the amount you paid us in the
          3 months preceding the claim.
        </p>
      </Section>

      <Section title="13. Changes to Terms">
        <p>
          We may update these terms. We will notify you of material changes by email or an in-app notice at least
          14 days before they take effect. Continued use after that constitutes acceptance of the updated terms.
        </p>
      </Section>

      <Section title="14. Governing Law">
        <p>
          These terms are governed by the laws of the United States and of the state in which Callverted is
          established, without regard to conflict-of-law rules. Disputes will be resolved through binding
          arbitration or in a court of competent jurisdiction, and you waive any right to a jury trial.
        </p>
      </Section>

      <Section title="15. Contact">
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
