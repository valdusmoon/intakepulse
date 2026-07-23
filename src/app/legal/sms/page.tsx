import Link from "next/link";

export const metadata = {
  title: "SMS Policy — Callverted",
  description: "Callverted does not send text messages. Here is what that means for your number and your alerts.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-3">{title}</h2>
      <div className="space-y-3 text-gray-600 leading-relaxed text-[.95rem]">{children}</div>
    </section>
  );
}

export default function SmsPage() {
  return (
    <div className="space-y-12">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">SMS Policy</h1>
        <p className="text-sm text-gray-400">Last updated: July 23, 2026</p>
        <p className="text-gray-600 mt-4 leading-relaxed">
          Short version: <strong>Callverted does not send text messages.</strong> Not to you, and not to the people
          who call your business. This page exists so that is stated plainly rather than assumed.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 text-sm text-gray-600 leading-relaxed">
        This page describes what the product does today. It is not legal advice.
      </div>

      <Section title="1. No SMS Program Is Running">
        <p>
          Callverted runs no marketing SMS, no transactional SMS, and no missed-call text-back. There is no SMS
          consent to give and no list to opt out of, because no messages are sent. An earlier version of this page
          described a text-message program from a previous version of the product. That program does not exist and
          this page replaces it.
        </p>
        <p>
          If that ever changes, we will update this page first with the consent flow, message frequency, carrier
          disclosure, and STOP and HELP handling before a single message goes out.
        </p>
      </Section>

      <Section title="2. Your Callverted Number Is a Voice Line">
        <p>
          The dedicated number we provision for your business is configured for voice only. If someone sends a text
          to it, Callverted does not receive that message, does not reply to it, and does not capture it as a lead.
          Point people to your Callverted number for calls, and keep using your existing channels for texting.
        </p>
      </Section>

      <Section title="3. How You Actually Get Alerted">
        <p>
          New jobs and new messages reach you two ways, both of which you control in Settings:
        </p>
        <ul className="list-disc ml-5 space-y-1.5">
          <li><strong>Web push</strong> to the browsers and installed devices you enable, with the caller, the priority tier, and the estimated value</li>
          <li><strong>Email</strong>, either a full lead packet for a job or a low-key note for a message</li>
        </ul>
        <p>
          Calls your own team answers are deliberately silent. You were already on the call, so there is nothing to
          alert you about. Weekly and monthly recap emails can be turned off in your notification preferences, and
          every marketing email carries an unsubscribe link.
        </p>
      </Section>

      <Section title="4. Contact">
        <p>
          Questions about this policy? Contact us at{" "}
          <a href="mailto:hello@callverted.com" className="text-orange-500 hover:underline">
            hello@callverted.com
          </a>
          .
        </p>
        <div className="flex gap-4 text-sm mt-2">
          <Link href="/legal/privacy" className="text-orange-500 hover:underline">Privacy Policy</Link>
          <Link href="/legal/terms" className="text-orange-500 hover:underline">Terms of Service</Link>
        </div>
      </Section>

    </div>
  );
}
