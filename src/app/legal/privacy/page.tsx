export const metadata = {
  title: "Privacy Policy — CraftCapture",
  description: "How CraftCapture collects, uses, and protects your information.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Privacy Policy</h1>
        <p className="text-sm text-gray-400">Last updated: April 13, 2026</p>
      </div>

      <p className="text-gray-600 leading-relaxed">
        CraftCapture ("we", "us", or "our") operates the CraftCapture platform at craftcapture.com. This policy
        explains what information we collect, how we use it, and your rights regarding that information.
      </p>

      <Section title="1. Information We Collect">
        <p>We collect information in two ways:</p>
        <ul>
          <li><strong>Information you provide:</strong> When you create an account, you provide your name, email address, business name, phone number, and billing information. When homeowners submit quote requests through your form, they provide their name, phone number, email, service type, and photos of their space.</li>
          <li><strong>Information collected automatically:</strong> We collect standard web analytics data (pages visited, time spent, browser type, referring URLs) and server logs for security and debugging purposes.</li>
        </ul>
      </Section>

      <Section title="2. How We Use Your Information">
        <ul>
          <li>To provide, operate, and improve the CraftCapture service</li>
          <li>To process payments and manage your subscription through Stripe</li>
          <li>To send transactional emails (lead notifications, account confirmations, billing receipts, review requests) via Resend</li>
          <li>To send transactional SMS notifications to painters via Twilio (new leads, quote responses, contract signatures, job scheduling) and to send one-time missed-call text-backs to homeowners who call a painter's CraftCapture number, or SMS updates to homeowners who opt in via the lead form</li>
          <li>To analyze homeowner-uploaded photos and generate condition notes via OpenAI's API</li>
          <li>To authenticate your account securely via Clerk</li>
          <li>To respond to support requests and communicate service updates</li>
        </ul>
      </Section>

      <Section title="3. Homeowner Data">
        <p>
          When homeowners submit quote requests through your company's form, their data (name, phone, email, photos,
          and project details) is stored in our database and associated with your account. You are responsible for
          handling that data appropriately and obtaining any necessary consents from homeowners you communicate with.
        </p>
        <p>
          Homeowner photos uploaded during the quote form are transmitted to OpenAI to generate condition notes and are subject to OpenAI's data handling policies. We do not use homeowner photos to train AI models.
        </p>
        <p>
          Job photos (before, progress, and after) uploaded by the painter are stored in Supabase Storage and are accessible only to the painter's account.
        </p>
        <p>
          When a job is marked complete, a one-time review request email is sent to the homeowner's email address on file. No further marketing emails are sent to homeowners.
        </p>
      </Section>

      <Section title="4. Information Sharing">
        <p>We do not sell your personal information. We share data with the following third-party services solely to operate the platform:</p>
        <ul>
          <li><strong>Clerk</strong> — authentication and session management</li>
          <li><strong>Stripe</strong> — payment processing and subscription billing</li>
          <li><strong>Supabase</strong> — database and file storage</li>
          <li><strong>OpenAI</strong> — AI-powered photo analysis for estimates</li>
          <li><strong>Twilio</strong> — transactional SMS notifications to painters</li>
          <li><strong>Resend</strong> — transactional email delivery</li>
          <li><strong>Vercel</strong> — hosting and infrastructure</li>
        </ul>
        <p>We may disclose information if required by law or to protect the rights, property, or safety of CraftCapture, our users, or others.</p>
      </Section>

      <Section title="5. Data Security">
        <p>
          We implement industry-standard security measures including encrypted data transmission (HTTPS), secure
          database hosting via Supabase, and payment processing entirely through Stripe — we never store credit
          card numbers on our servers.
        </p>
        <p>
          No system is 100% secure. If you believe your account has been compromised, contact us immediately at{" "}
          <a href="mailto:hello@craftcapture.com" className="text-orange-500 hover:underline">hello@craftcapture.com</a>.
        </p>
      </Section>

      <Section title="6. Data Retention">
        <p>
          We retain your account data and leads for as long as your account is active. If you cancel your
          subscription, your data remains accessible and is retained for 90 days before being deleted, unless you
          request earlier deletion. You can request deletion of your account and all associated data by emailing us.
        </p>
      </Section>

      <Section title="7. Cookies">
        <p>
          We use cookies and similar technologies to maintain your authenticated session and remember your
          preferences. We do not use third-party advertising cookies. You can control cookie settings through
          your browser, though disabling cookies may affect the functionality of the app.
        </p>
      </Section>

      <Section title="8. Your Rights">
        <p>You have the right to:</p>
        <ul>
          <li>Access the personal information we hold about you</li>
          <li>Correct inaccurate data</li>
          <li>Request deletion of your account and associated data</li>
          <li>Export your lead data</li>
        </ul>
        <p>
          To exercise any of these rights, email us at{" "}
          <a href="mailto:hello@craftcapture.com" className="text-orange-500 hover:underline">hello@craftcapture.com</a>.
        </p>
      </Section>

      <Section title="9. Children's Privacy">
        <p>
          CraftCapture is not directed at children under 13. We do not knowingly collect information from children.
          If you believe a child has provided us with personal information, please contact us and we will delete it.
        </p>
      </Section>

      <Section title="10. Changes to This Policy">
        <p>
          We may update this policy from time to time. We will notify you of material changes by email or by posting
          a notice on the dashboard. Continued use of the service after changes are posted constitutes acceptance
          of the updated policy.
        </p>
      </Section>

      <Section title="11. Contact">
        <p>
          For privacy-related questions, contact us at{" "}
          <a href="mailto:hello@craftcapture.com" className="text-orange-500 hover:underline">hello@craftcapture.com</a>.
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
