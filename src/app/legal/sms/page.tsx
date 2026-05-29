import Link from "next/link";

export const metadata = {
  title: "SMS Policy & Consent — CraftCapture",
  description: "How CraftCapture uses SMS, consent flows, and opt-out instructions.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-3">{title}</h2>
      <div className="space-y-3 text-gray-600 leading-relaxed text-[.95rem]">{children}</div>
    </section>
  );
}

function MessageBubble({ from, text }: { from: "craftcapture" | "painter"; text: string }) {
  const isApp = from === "craftcapture";
  return (
    <div className={`flex ${isApp ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isApp
            ? "bg-gray-100 text-gray-800 rounded-tl-sm"
            : "text-white rounded-tr-sm"
        }`}
        style={!isApp ? { background: "linear-gradient(135deg,#F97316,#FB923C)" } : {}}
      >
        {text}
      </div>
    </div>
  );
}

function PhoneMockup({ label, messages }: { label: string; messages: Array<{ from: "craftcapture" | "painter"; text: string }> }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden max-w-sm">
        <div className="bg-gray-200 px-4 py-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gray-400" />
          <span className="text-xs text-gray-500 font-medium">Messages</span>
        </div>
        <div className="px-4 py-4 space-y-3">
          {messages.map((m, i) => (
            <MessageBubble key={i} from={m.from} text={m.text} />
          ))}
        </div>
      </div>
    </div>
  );
}


function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block bg-orange-50 text-orange-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-orange-100">
      {children}
    </span>
  );
}

export default function SmsPage() {
  return (
    <div className="space-y-12">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">SMS Policy &amp; Consent</h1>
        <p className="text-sm text-gray-400">Last updated: April 25, 2026</p>
        <p className="text-gray-600 mt-4 leading-relaxed">
          CraftCapture uses SMS to help painting contractors respond faster to leads and keep homeowners
          informed. This page explains every SMS touchpoint, who receives messages, how consent is
          collected, and how to opt out. SMS is powered by Twilio.
        </p>
      </div>

      {/* ── Section 1: Painter notifications ─────────────────────────────────── */}
      <Section title="1. Painter (Business Owner) Notifications">
        <p>
          Painting contractors opt in to SMS notifications on a per-event basis from their account
          settings after creating a CraftCapture account. All SMS notifications are off by default —
          painters explicitly enable only the events they want to be notified about. They can turn
          any notification on or off at any time without closing their account.
        </p>
        <p>
          Four notification types are available: new lead received, quote accepted or declined,
          contract signed, and job scheduled.
        </p>

        {/* Settings mockup */}
        <div className="my-6 space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Painter dashboard — notification settings</p>
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden max-w-sm shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <p className="text-sm font-semibold text-gray-700">Notification preferences</p>
            </div>
            {[
              { label: "New lead received", email: true, sms: true },
              { label: "Quote accepted / declined", email: true, sms: true },
              { label: "Contract signed", email: true, sms: false },
              { label: "Job scheduled", email: true, sms: false },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-600">{row.label}</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <div className={`w-3.5 h-3.5 rounded border ${row.email ? "bg-orange-500 border-orange-500" : "border-gray-300"} flex items-center justify-center`}>
                      {row.email && <svg viewBox="0 0 12 12" fill="none" className="w-2.5 h-2.5"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </div>
                    <span className="text-xs text-gray-400">Email</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={`w-3.5 h-3.5 rounded border ${row.sms ? "bg-orange-500 border-orange-500" : "border-gray-300"} flex items-center justify-center`}>
                      {row.sms && <svg viewBox="0 0 12 12" fill="none" className="w-2.5 h-2.5"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </div>
                    <span className="text-xs text-gray-400">SMS</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sample messages */}
        <div className="my-6 grid gap-4 sm:grid-cols-2">
          <PhoneMockup
            label="New lead alert"
            messages={[{
              from: "craftcapture",
              text: "New lead from CraftCapture: Sarah Johnson (555-234-5678) submitted a request for interior painting. Log in to respond: craftcapture.com/dashboard. Reply STOP to opt out.",
            }]}
          />
          <PhoneMockup
            label="Quote accepted"
            messages={[{
              from: "craftcapture",
              text: "CraftCapture: Sarah Johnson accepted your quote for $2,400. Log in to send a contract: craftcapture.com/dashboard. Reply STOP to opt out.",
            }]}
          />
          <PhoneMockup
            label="Contract signed"
            messages={[{
              from: "craftcapture",
              text: "CraftCapture: Sarah Johnson signed their contract. Log in to schedule the job: craftcapture.com/dashboard. Reply STOP to opt out.",
            }]}
          />
          <PhoneMockup
            label="Missed call alert"
            messages={[{
              from: "craftcapture",
              text: "CraftCapture: You missed a call from 555-234-5678. We sent them a text to request a free estimate on your behalf. Log in to follow up: craftcapture.com/dashboard. Reply STOP to opt out.",
            }]}
          />
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          <Tag>Transactional</Tag>
          <Tag>Opt-in via settings</Tag>
          <Tag>Configurable per event</Tag>
        </div>
      </Section>

      {/* ── Section 2: Homeowner messages ────────────────────────────────────── */}
      <Section title="2. Homeowner Messages">

        <p>
          Homeowners interact with CraftCapture through a painter's public lead capture form
          (no account required). SMS messages to homeowners fall into two categories:
        </p>

        <h3 className="text-base font-semibold text-gray-800 mt-4">2a. Lead Form — Quote & Follow-up Updates</h3>
        <p>
          When a homeowner submits a quote request through a painter's CraftCapture form, they
          see an optional SMS consent checkbox on the contact step. By checking this box, they
          consent to receive SMS updates about their request — including their estimate, quote,
          and scheduling communications from the painter. If unchecked, they will receive
          communications via email only.
        </p>

        {/* Homeowner lead form mockup */}
        <div className="my-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Homeowner lead form — contact step (public page)</p>
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden max-w-sm shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-[#0F1628] to-[#1E2A45]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center text-white text-xs font-black">P</div>
                <div>
                  <p className="text-[.82rem] font-bold text-white">Blue Ridge Painting</p>
                  <p className="text-[.68rem] text-white/50">Free estimate</p>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <p className="text-[.7rem] font-bold text-gray-400 uppercase tracking-wide mb-1">Almost there</p>
                <p className="text-sm font-bold text-gray-900">Your contact info</p>
              </div>
              {["Full name", "Phone number", "Email"].map((field) => (
                <div key={field}>
                  <p className="text-xs font-semibold text-gray-700 mb-1">{field}</p>
                  <div className="border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-300 bg-gray-50">&nbsp;</div>
                </div>
              ))}
              <label className="flex items-start gap-2.5 pt-1">
                <div className="mt-0.5 w-4 h-4 rounded border-2 border-orange-500 bg-orange-500 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-[.68rem] text-gray-400 leading-relaxed">
                  Get updates by text too? Message &amp; data rates may apply. Reply STOP to opt out.{" "}
                  <span className="underline">Privacy Policy</span>
                </span>
              </label>
              <div className="bg-orange-500 rounded-xl py-2.5 text-center text-xs font-bold text-white">
                See my estimate →
              </div>
            </div>
          </div>
        </div>

        <h3 className="text-base font-semibold text-gray-800 mt-6">2b. Missed-Call Text-Back</h3>
        <p>
          Each painter on CraftCapture is assigned a dedicated phone number. When a homeowner
          calls that number and the call goes unanswered, CraftCapture automatically sends a
          single SMS text-back to the caller. The text-back contains a link to request a free
          estimate and is a direct response to the homeowner&apos;s inbound call action.
        </p>
        <p>
          This is a one-time message per missed call. No further messages are sent unless the
          homeowner submits a lead form and explicitly consents (see 2a above).
        </p>

        <div className="my-6">
          <PhoneMockup
            label="Homeowner receives — missed-call text-back"
            messages={[{
              from: "craftcapture",
              text: "Hi! We missed your call to Blue Ridge Painting. Request a free estimate here: craftcapture.com/quote/abc123. Reply STOP to opt out.",
            }]}
          />
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          <Tag>One-time per missed call</Tag>
          <Tag>Response to inbound call</Tag>
          <Tag>Opt-in via lead form for further messages</Tag>
        </div>
      </Section>

      {/* ── Section 3: Message details ────────────────────────────────────────── */}
      <Section title="3. Message Frequency, Rates &amp; Opt-Out">
        <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
          {[
            { label: "Message frequency", value: "Varies by account activity. Painters typically receive 1–5 messages per new job. Homeowners receive at most 1 missed-call text-back per call, plus updates if they submit a lead form." },
            { label: "Message & data rates", value: "Standard message and data rates may apply depending on your carrier and plan." },
            { label: "To opt out", value: 'Reply STOP to any message. You will receive one final confirmation and no further messages will be sent.' },
            { label: "For help", value: "Reply HELP to any message, or email support@craftcapture.com." },
            { label: "SMS provider", value: "All messages are sent via Twilio." },
          ].map((row, i, arr) => (
            <div key={row.label} className={`flex gap-4 px-5 py-4 ${i < arr.length - 1 ? "border-b border-gray-200" : ""}`}>
              <p className="text-sm font-semibold text-gray-700 w-40 shrink-0">{row.label}</p>
              <p className="text-sm text-gray-600 leading-relaxed">{row.value}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Section 4: Contact ────────────────────────────────────────────────── */}
      <Section title="4. Contact &amp; Further Information">
        <p>
          Questions about our SMS practices? Contact us at{" "}
          <a href="mailto:support@craftcapture.com" className="text-orange-500 hover:underline">
            support@craftcapture.com
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
