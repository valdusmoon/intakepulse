export const metadata = {
  title: "Privacy Policy — Callverted",
  description: "How Callverted collects, uses, and protects your information.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Privacy Policy</h1>
        <p className="text-sm text-gray-400">Last updated: July 9, 2026</p>
      </div>

      <p className="text-gray-600 leading-relaxed">
        Callverted ("we", "us", or "our") operates the Callverted platform at callverted.com — an AI voice-overflow
        receptionist and lead-capture service for home-service businesses (water/fire/mold restoration, HVAC,
        plumbing, electrical, general contracting, and other home-service trades). This policy explains what
        information we collect, how we use it, and your rights regarding that information. Throughout this policy,
        "you" refers to the business that signs up for Callverted; "caller" or "lead" refers to the people who
        call, message, or submit a form to that business.
      </p>

      <Section title="1. Information We Collect">
        <ul>
          <li><strong>Account information (you, the business):</strong> When you create a Callverted account, we collect your business name, your name, email address, phone number, service area, and the trade category you select. Billing information is collected and processed by Stripe on our behalf.</li>
          <li><strong>Caller and lead information:</strong> When someone calls your Callverted phone number, fills out your public intake form, or uses your embedded website widget, we collect their name (if given), phone number, email address (if given), and their answers to your business's intake questions — typically a service-type question plus a few standard follow-up questions about urgency, timing, and insurance/warranty/financing coverage.</li>
          <li><strong>Call transcripts and summaries:</strong> Every AI-handled call produces a written transcript and a short AI-generated summary. If you enable call recording in Settings, calls your own team answers are also recorded and transcribed so they can be summarized and scored into leads. In all cases the call audio is used only to generate the transcript and is then deleted — we do not retain call audio.</li>
          <li><strong>AI-generated scoring data:</strong> For each captured lead, we generate an urgency score (1–10), a quality score (1–100), an estimated job-value range, and written reasoning explaining those scores, based on the intake answers.</li>
          <li><strong>Information collected automatically:</strong> We collect standard web analytics data (pages visited, time spent, browser type, referring URLs) and server logs for security and debugging purposes.</li>
        </ul>
      </Section>

      <Section title="2. How We Use Your Information">
        <ul>
          <li>To operate the AI voice-overflow receptionist, public intake form, and embeddable website widget</li>
          <li>To have OpenAI's models converse with callers by voice and to generate the urgency/quality scores, estimated job-value range, and written reasoning for each lead</li>
          <li>To route, answer, forward, and (if enabled) record phone calls via Twilio</li>
          <li>To send you transactional email notifications via Resend for each new lead — including the caller's scores and AI reasoning — as well as account and billing emails</li>
          <li>To process payments and manage your subscription through Stripe</li>
          <li>To authenticate your account securely via Clerk</li>
          <li>To respond to support requests and communicate service updates</li>
        </ul>
      </Section>

      <Section title="3. Caller and Lead Data">
        <p>
          When someone calls, messages, or submits a form associated with your business, their information — name,
          phone number, email, intake answers, and call transcript if applicable — is stored in our
          database and associated with your Callverted account. You are responsible for handling that data
          appropriately and for obtaining any consents required under applicable law, including for call recording
          (see below).
        </p>
        <p>
          Call audio and transcripts, along with intake answers, are transmitted to OpenAI's API to hold the voice
          conversation and to generate scores and reasoning, and are subject to OpenAI's data handling policies. We
          do not use this data to train our own AI models.
        </p>
        <p>We do not sell caller or lead information, and we do not use it for advertising.</p>
      </Section>

      <Section title="4. Call Recording">
        <p>
          Call recording is off by default. If a business turns it on in Settings, Callverted plays a spoken
          disclosure to callers at the start of the call — businesses are responsible for writing disclosure
          language that satisfies the recording-consent laws of the jurisdictions where they and their callers are
          located. When recording is enabled, calls your team answers are recorded so they can be transcribed and
          scored the same way AI-handled calls are. In every case the audio is used only to generate the written
          transcript and summary and is then deleted; we do not retain call audio for playback or storage.
        </p>
      </Section>

      <Section title="5. Information Sharing">
        <p>We do not sell your personal information. We share data with the following third-party services solely to operate the platform:</p>
        <ul>
          <li><strong>Clerk</strong> — authentication and session management</li>
          <li><strong>Stripe</strong> — payment processing and subscription billing</li>
          <li><strong>Supabase</strong> — our PostgreSQL database, where account, call, and lead data is stored</li>
          <li><strong>OpenAI</strong> — the voice conversation itself, and AI-generated lead scoring and reasoning</li>
          <li><strong>Twilio</strong> — inbound/outbound call handling and optional call recording</li>
          <li><strong>Resend</strong> — transactional email delivery</li>
          <li><strong>Vercel</strong> — hosting and infrastructure</li>
        </ul>
        <p>We may disclose information if required by law or to protect the rights, property, or safety of Callverted, our users, or others.</p>
      </Section>

      <Section title="6. Data Security">
        <p>
          We implement industry-standard security measures including encrypted data transmission (HTTPS), secure
          database hosting via Supabase, and payment processing entirely through Stripe — we never store credit
          card numbers on our servers.
        </p>
        <p>
          No system is 100% secure. If you believe your account has been compromised, contact us immediately at{" "}
          <a href="mailto:hello@callverted.com" className="text-orange-500 hover:underline">hello@callverted.com</a>.
        </p>
      </Section>

      <Section title="7. Data Retention">
        <p>
          We retain your account data, calls, and leads for as long as your account is active. If you cancel your
          subscription, your data remains accessible and is retained for 90 days before being deleted, unless you
          request earlier deletion. You can request deletion of your account and all associated data by emailing us.
        </p>
      </Section>

      <Section title="8. Cookies">
        <p>
          We use cookies and similar technologies to maintain your authenticated session and remember your
          preferences. We do not use third-party advertising cookies. You can control cookie settings through
          your browser, though disabling cookies may affect the functionality of the app.
        </p>
      </Section>

      <Section title="9. Your Rights">
        <p>You have the right to:</p>
        <ul>
          <li>Access the personal information we hold about you</li>
          <li>Correct inaccurate data</li>
          <li>Request deletion of your account and associated data</li>
          <li>Request a copy of the lead and call data associated with your account</li>
        </ul>
        <p>
          To exercise any of these rights, email us at{" "}
          <a href="mailto:hello@callverted.com" className="text-orange-500 hover:underline">hello@callverted.com</a>.
        </p>
      </Section>

      <Section title="10. Children's Privacy">
        <p>
          Callverted is not directed at children under 13. We do not knowingly collect information from children.
          If you believe a child has provided us with personal information, please contact us and we will delete it.
        </p>
      </Section>

      <Section title="11. Changes to This Policy">
        <p>
          We may update this policy from time to time. We will notify you of material changes by email or by posting
          a notice on the dashboard. Continued use of the service after changes are posted constitutes acceptance
          of the updated policy.
        </p>
      </Section>

      <Section title="12. Contact">
        <p>
          For privacy-related questions, contact us at{" "}
          <a href="mailto:hello@callverted.com" className="text-orange-500 hover:underline">hello@callverted.com</a>.
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
