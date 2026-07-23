export const metadata = {
  title: "Privacy Policy — Callverted",
  description: "How Callverted collects, uses, and protects your information.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Privacy Policy</h1>
        <p className="text-sm text-gray-400">Last updated: July 23, 2026</p>
      </div>

      <p className="text-gray-600 leading-relaxed">
        Callverted ("we", "us", or "our") operates the Callverted platform at callverted.com. Callverted captures
        inbound contacts for home-service businesses (restoration, HVAC, plumbing, electrical, general contracting,
        and similar trades), sorts real jobs from messages, ranks them for callback, and records how fast a human
        responded. This policy explains what we collect, why, and what we do not do. Two groups of people appear
        throughout: the <strong>business</strong> that signs up for Callverted ("you"), and the <strong>caller</strong>{" "}
        who phones that business or fills in its intake form.
      </p>

      <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 text-sm text-gray-600 leading-relaxed">
        This page describes how the Callverted product actually handles data. It is not legal advice. Your own
        obligations to your callers depend on where you and they are located, so talk to a lawyer about those.
      </div>

      <Section title="1. Our Role and Yours">
        <p>
          For data about <strong>your own account</strong> (your name, your business details, your billing record),
          Callverted is the controller. For data about <strong>your callers</strong>, you are the controller and
          Callverted is the processor: we capture, store, and organize that data on your behalf and act on your
          instructions. You decide what happens with your leads, and you are responsible for the notices and
          consents your jurisdiction requires from your callers.
        </p>
      </Section>

      <Section title="2. Information We Collect">
        <p><strong>Business account information.</strong> When you create an account we collect your business name, owner name, email address, phone number, service area, timezone, and trade category. We also store the settings you configure: your forwarding number, greeting and AI instruction text, your service list and pricing, your recording setting and the disclosure wording you write, and your notification preferences. Billing details are collected and held by Stripe. We never see or store your card number.</p>
        <p><strong>Caller and lead information.</strong> Callverted creates one lead record per captured contact. No profile is built across contacts. A lead record can contain:</p>
        <ul>
          <li>The caller's phone number, taken automatically from caller ID on a phone call, or typed on the intake form</li>
          <li>The caller's name. On a job call the AI never asks for it and only records it if the caller volunteers it. On a message call and on the web form, it is asked</li>
          <li>An email address, only if the caller gives one on the web form. The AI never asks for an email by phone</li>
          <li>The normalized intake answers: the service needed, urgency, when the issue came up, insurance/warranty/financing coverage, and the ZIP code. We ask for a ZIP, not a street address</li>
          <li>The service the caller asked for in their own words, when it does not match a configured service</li>
          <li>Notes: the message content or the caller's reason for calling, in their words</li>
          <li>Scores we compute (urgency, quality, priority) with the trace explaining them, and a backend job-value estimate range</li>
          <li>Status and timing fields your team drives, such as when a human first made contact</li>
        </ul>
        <p><strong>Call records.</strong> One record per inbound phone call, whoever answered: the caller's number, the Callverted number dialed, timings and duration, the outcome (your team answered, the AI captured it, the caller hung up, or the call was screened as a wrong number or solicitation), the turn-by-turn transcript, and a short AI-written summary that is generated with an instruction to leave out names, phone numbers, and addresses. We also keep the raw webhook payload our telephony provider sends us, for debugging and to avoid processing the same event twice. That payload can include caller-ID metadata supplied by the carrier, such as city and state.</p>
        <p><strong>AI assessment records.</strong> For job leads only, we store the plain-English reasoning that explains the already-computed scores, plus the raw model response for debugging. Messages are never scored and get no assessment record.</p>
        <p><strong>Prospect information.</strong> If you use the ROI calculator, request a demo, or download something from our marketing site, we store the email address you enter, which tool you used, and the figures you typed into it. If you unsubscribe, we keep your address on a suppression list so we can keep honoring that.</p>
        <p><strong>Technical information.</strong> If you turn on push alerts, we store the push endpoint and keys your browser issues, plus a browser/device label so you can tell your devices apart. We keep server logs for security and debugging. Public endpoints (the intake form and the marketing capture form) use the requesting IP address for rate limiting when that limiter is configured. We do not run third-party advertising or analytics trackers on the site.</p>
      </Section>

      <Section title="3. Call Audio, Recording, and Disclosure">
        <p>
          <strong>Callverted does not retain call audio.</strong> There is no audio playback anywhere in the
          product, because there is no stored audio to play. Two different paths handle sound, and neither one ends
          with a saved file:
        </p>
        <ul>
          <li>
            <strong>Calls the AI answers.</strong> Audio streams live between the phone network and OpenAI's
            realtime API for the length of the call so the assistant can hear and speak. No recording file is
            created. What we keep afterward is the written transcript and the short summary.
          </li>
          <li>
            <strong>Calls your team answers.</strong> These are recorded only if you turn recording on in Settings{" "}
            <em>and</em> you have written a spoken disclosure. Without a disclosure, nothing is recorded. When both
            are set, our telephony provider records the answered conversation, we download it once to transcribe it
            with OpenAI's speech-to-text model, and then we delete the recording from the provider. The audio is
            never copied into our database or file storage.
          </li>
        </ul>
        <p>
          Deletion runs immediately after the transcript is written. If a delete call fails, the failure is logged
          so it can be cleared, and a repeat of the same job deletes the audio without re-processing anything.
        </p>
        <p>
          <strong>Both parties are told.</strong> When recording is on, your disclosure is spoken to the caller
          before your team is dialed, and it is spoken again at the start of the AI's greeting if the AI picks up.
          The AI also identifies itself as an automated assistant on every call it answers, whether or not recording
          is on. You write the disclosure wording, and you are responsible for making it satisfy the recording and
          wiretapping laws of every place you and your callers are located.
        </p>
      </Section>

      <Section title="4. What Callverted Deliberately Does Not Do">
        <ul>
          <li><strong>It is not a CRM.</strong> We do not build person or customer records, do not thread contact history, and do not merge repeat callers into an identity. Each captured contact is one standalone lead record.</li>
          <li><strong>No cross-business sharing.</strong> Your callers' data belongs to your account. It is never pooled with, matched against, or shown to another business on the platform.</li>
          <li><strong>No sale of data, ever, and no advertising use.</strong></li>
          <li><strong>No model training on your data.</strong> We do not train AI models, and we do not hand caller or lead data to anyone for that purpose.</li>
          <li><strong>No SMS.</strong> Callverted does not text your callers and does not text you. See our <a href="/legal/sms">SMS Policy</a>.</li>
          <li><strong>Test calls store nothing.</strong> A test call you make from the dashboard creates no lead and no call record.</li>
        </ul>
      </Section>

      <Section title="5. How We Use Information">
        <ul>
          <li>To answer, route, and capture inbound calls, and to run the public intake form and website widget</li>
          <li>To turn what the caller said into a structured lead: extracting their answers, classifying the contact as a job, a message, or junk, and writing the call summary</li>
          <li>To compute urgency, quality, and priority scores and a backend job-value estimate, and to write the reasoning that explains them</li>
          <li>To alert you by web push and email when a job or a message comes in, and to send weekly and monthly performance recaps you can turn off</li>
          <li>To run your account: authentication, billing, receipts, trial reminders, and support</li>
          <li>To keep the service secure and working, including logging, rate limiting, and debugging</li>
        </ul>
      </Section>

      <Section title="6. AI Processing and Its Limits">
        <p>
          Callverted uses OpenAI models to hold the spoken conversation, transcribe audio, extract answers,
          classify the contact, and write summaries and score explanations. Call audio and transcript text are
          therefore processed by that third-party AI provider under its API data policies.
        </p>
        <p>The model's authority is deliberately narrow, and this matters for what can be said to your callers:</p>
        <ul>
          <li>It speaks the exact lines it is given, or it classifies an answer into a fixed set of options. It does not improvise</li>
          <li>It never quotes a price you have not approved. If you have not approved wording for that service, the caller is told the team will review the details first</li>
          <li>It does not book appointments and does not commit you to anything</li>
          <li>It never bridges a call to a human. Warm transfer was removed from the product entirely. A caller who wants a person gets a callback message taken instead</li>
          <li>Scores are computed by code, not by the model. The model only explains a number that was already decided</li>
        </ul>
        <p>
          Scores, summaries, transcripts, and value estimates are approximations meant to help you triage. They are
          not guarantees, and machine transcription can misread what was said.
        </p>
      </Section>

      <Section title="7. Who We Share Data With">
        <p>We do not sell personal information. We share data with these providers only to run the platform:</p>
        <ul>
          <li><strong>Twilio</strong>: phone numbers, inbound call handling, and the optional recording of a team-answered call (deleted after transcription)</li>
          <li><strong>OpenAI</strong>: the realtime voice conversation, speech-to-text transcription, answer extraction, classification, summaries, and score explanations</li>
          <li><strong>Clerk</strong>: sign-in, sessions, and account identity</li>
          <li><strong>Supabase</strong>: the PostgreSQL database where account, lead, and call data is stored</li>
          <li><strong>Stripe</strong>: subscription billing and payment processing</li>
          <li><strong>Resend</strong>: transactional and account email delivery</li>
          <li><strong>Vercel</strong>: application hosting and platform logs</li>
          <li><strong>Inngest</strong>: background job processing, such as post-call transcription and scheduled emails</li>
          <li><strong>Upstash</strong>: rate limiting on public endpoints, when configured</li>
        </ul>
        <p>
          Push alerts are delivered through the push service run by your browser or device vendor, such as Google,
          Apple, or Mozilla. The alert content is encrypted to your device.
        </p>
        <p>We may disclose information if required by law, or to protect the rights, property, or safety of Callverted, our users, or others. If Callverted is ever acquired, account and lead data may transfer as part of that transaction, and we will say so before it happens.</p>
        <p>Inside Callverted, access to production data is limited to the people who need it to operate and support the service.</p>
      </Section>

      <Section title="8. Data Security">
        <p>
          Traffic is encrypted in transit over HTTPS. Accounts are authenticated through Clerk, application queries
          are scoped to a single business, and inbound telephony webhooks are signature-verified before we act on
          them. Card numbers never touch our servers, and call audio is never stored.
        </p>
        <p>
          We describe our practices here rather than claim a certification. Callverted holds no security or privacy
          certification, and no system is completely secure. If you believe your account has been compromised,
          contact us immediately at{" "}
          <a href="mailto:hello@callverted.com" className="text-orange-500 hover:underline">hello@callverted.com</a>.
        </p>
      </Section>

      <Section title="9. Data Retention and Deletion">
        <ul>
          <li><strong>Call audio:</strong> not retained. See section 3</li>
          <li><strong>Leads, calls, transcripts, and summaries:</strong> kept while your account is active, so your history and reports stay intact</li>
          <li><strong>After cancellation:</strong> your data is kept for at least 90 days so you can request an export. We do not run an automatic purge on a fixed schedule, so if you want it gone sooner or want confirmation that it is gone, email us and we will delete it</li>
          <li><strong>On request:</strong> we delete an account and its associated lead, call, and assessment data within 30 days of a verified request, except where we must keep something to meet a legal or tax obligation</li>
          <li><strong>Unsubscribe records:</strong> kept indefinitely, because that is what lets us keep honoring the opt-out</li>
        </ul>
      </Section>

      <Section title="10. Cookies">
        <p>
          We use cookies to keep you signed in and to remember your preferences. Sign-in cookies are set by Clerk.
          We do not use advertising cookies or third-party tracking pixels. You can control cookies in your browser,
          though blocking them will stop the dashboard from working.
        </p>
      </Section>

      <Section title="11. Your Rights">
        <p><strong>If you are a Callverted customer,</strong> you can access your account data at any time in the dashboard, export your leads, calls, and reports to CSV, correct your settings yourself, and ask us to delete your account and its data.</p>
        <p><strong>If you are a caller</strong> whose information a business captured through Callverted, that business controls your data. Contact the business you called first. If you contact us, we will help route your request to them and will act on their instruction, and we can confirm what categories of data Callverted holds.</p>
        <p>
          Depending on where you live, you may have additional rights over your personal information under local
          law. To make any request, email{" "}
          <a href="mailto:hello@callverted.com" className="text-orange-500 hover:underline">hello@callverted.com</a>.
        </p>
      </Section>

      <Section title="12. Children's Privacy">
        <p>
          Callverted is a business tool and is not directed at children under 13. We do not knowingly collect
          information from children. If you believe a child has provided us with personal information, contact us
          and we will delete it.
        </p>
      </Section>

      <Section title="13. Changes to This Policy">
        <p>
          We may update this policy. Material changes will be announced by email or by a notice in the dashboard,
          and the date at the top of this page will change. Continued use of the service after an update takes
          effect means you accept it.
        </p>
      </Section>

      <Section title="14. Contact">
        <p>
          For privacy questions, contact us at{" "}
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
