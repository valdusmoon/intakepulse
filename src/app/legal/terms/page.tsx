export const metadata = {
  title: "Terms of Service — CraftCapture",
  description: "Terms and conditions for using the CraftCapture platform.",
};

export default function TermsOfServicePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Terms of Service</h1>
        <p className="text-sm text-gray-400">Last updated: April 13, 2026</p>
      </div>

      <p className="text-gray-600 leading-relaxed">
        These Terms of Service govern your use of CraftCapture ("Service"), operated by CraftCapture ("we", "us", "our").
        By accessing or using the Service, you agree to these terms. If you do not agree, do not use the Service.
      </p>

      <Section title="1. Description of Service">
        <p>
          CraftCapture is a lead capture and job management platform for painting contractors. It provides a homeowner-facing
          quote request form, AI-powered instant cost estimates, a lead pipeline dashboard, professional quotes and contracts
          with electronic signatures, job scheduling, AI-powered color visualization, job photo management, email and SMS
          notifications, automated review requests, an embeddable website widget, data export, and related tools.
          The Service is intended for use by professional painting contractors and their businesses.
        </p>
      </Section>

      <Section title="2. Account Registration">
        <p>
          You must create an account to use CraftCapture. You agree to provide accurate, complete information and to
          keep it updated. You are responsible for all activity under your account and for maintaining the security
          of your credentials. Notify us immediately at{" "}
          <a href="mailto:hello@craftcapture.com">hello@craftcapture.com</a> if you suspect unauthorized access.
        </p>
        <p>
          You must be at least 18 years old and legally capable of entering into a binding contract to use the Service.
        </p>
      </Section>

      <Section title="3. Subscription and Billing">
        <p>
          CraftCapture is offered as a paid subscription at $79/month. A 14-day free trial is available to new accounts.
          No payment is charged during the trial period. By starting a trial, you authorize us to charge your payment
          method at the end of the trial unless you cancel first.
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
          <li>Transmit spam, unsolicited communications, or misleading content to homeowners</li>
          <li>Upload photos or content that you do not have the right to use</li>
          <li>Attempt to reverse engineer, scrape, or copy the Service</li>
          <li>Interfere with or disrupt the integrity or performance of the Service</li>
          <li>Use the Service to misrepresent your business, pricing, or qualifications to homeowners</li>
          <li>Share your account credentials or resell access to the Service</li>
        </ul>
      </Section>

      <Section title="5. Estimates and AI Features">
        <p>
          CraftCapture generates instant ballpark cost estimates using a formula based on your labor rates and homeowner-provided home details. These estimates are clearly labeled as preliminary ranges and are not guaranteed quotes.
        </p>
        <p>
          CraftCapture also uses OpenAI's API to analyze homeowner-uploaded photos and generate condition notes. You acknowledge that:
        </p>
        <ul>
          <li>Estimates may be inaccurate and should not replace in-person assessments</li>
          <li>AI-generated photo notes are approximations only</li>
          <li>You are solely responsible for the final quotes and prices you provide to homeowners</li>
          <li>CraftCapture is not liable for any disputes arising from estimates or AI-generated content</li>
        </ul>
      </Section>

      <Section title="5a. SMS Notifications">
        <p>
          CraftCapture sends SMS notifications to the painter's registered phone number for key job events (new leads, quote responses, contract signatures, job scheduling). These are transactional notifications related to your use of the Service and are sent via Twilio. Message frequency varies based on account activity. Message and data rates may apply depending on your carrier.
        </p>
        <p>
          When a homeowner calls a painter's CraftCapture phone number and the call goes unanswered, CraftCapture may send a one-time automated text-back to the caller with a link to request a free estimate. Homeowners who submit a quote request through a painter's CraftCapture lead form may optionally consent to receive SMS updates related to their request (estimate, quote, scheduling). If they do not opt in, communications are sent via email only.
        </p>
        <p>
          To opt out of SMS messages at any time, reply <strong>STOP</strong> to any message. For help, reply <strong>HELP</strong> or contact us at support@craftcapture.com. After opting out, you will receive one final confirmation message and no further messages will be sent.
        </p>
        <p>
          CraftCapture also sends a one-time review request email to homeowners when a job is marked as complete. This email is a transactional communication directly related to the completed service.
        </p>
      </Section>

      <Section title="6. Homeowner Data and Privacy">
        <p>
          When homeowners submit quote requests through your company's form, their data is associated with your
          account. You agree to handle homeowner data responsibly, in compliance with applicable privacy laws,
          and only for legitimate business purposes (following up on painting inquiries). You may not use homeowner
          data for unrelated marketing or share it with third parties.
        </p>
      </Section>

      <Section title="7. Intellectual Property">
        <p>
          CraftCapture and its original content, features, and functionality are owned by us and are protected by
          applicable intellectual property laws. You retain ownership of the content you upload (photos, notes,
          etc.) and grant us a limited license to store and process it to provide the Service.
        </p>
      </Section>

      <Section title="8. Termination">
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

      <Section title="9. Disclaimer of Warranties">
        <p>
          The Service is provided "as is" and "as available" without warranties of any kind, express or implied,
          including but not limited to merchantability, fitness for a particular purpose, or non-infringement.
          We do not warrant that the Service will be uninterrupted, error-free, or that AI estimates will meet
          any particular accuracy standard.
        </p>
      </Section>

      <Section title="10. Limitation of Liability">
        <p>
          To the maximum extent permitted by law, CraftCapture and its owners shall not be liable for any indirect,
          incidental, special, consequential, or punitive damages — including lost profits, lost revenue, or lost
          business — arising from your use of or inability to use the Service, even if we have been advised of
          the possibility of such damages.
        </p>
        <p>
          Our total liability to you for any claim arising from the Service shall not exceed the amount you paid
          us in the 3 months preceding the claim.
        </p>
      </Section>

      <Section title="11. Changes to Terms">
        <p>
          We may update these terms from time to time. We will notify you of material changes by email or through
          an in-app notice at least 14 days before they take effect. Continued use of the Service after changes
          take effect constitutes acceptance of the updated terms.
        </p>
      </Section>

      <Section title="12. Governing Law">
        <p>
          These terms are governed by the laws of the United States. Any disputes shall be resolved through
          binding arbitration or in the courts of competent jurisdiction, and you waive any right to a jury trial.
        </p>
      </Section>

      <Section title="13. Contact">
        <p>
          For questions about these terms, contact us at{" "}
          <a href="mailto:hello@craftcapture.com">hello@craftcapture.com</a>.
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
