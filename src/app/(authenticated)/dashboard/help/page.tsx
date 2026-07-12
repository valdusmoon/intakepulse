import {
  Rocket,
  LayoutDashboard,
  Inbox,
  Phone,
  Code2,
  BarChart3,
  Settings2,
  CreditCard,
  Star,
} from "lucide-react";

const sections = [
  { id: "getting-started", label: "Getting Started", icon: Rocket },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "leads", label: "Leads", icon: Inbox },
  { id: "calls", label: "Calls", icon: Phone },
  { id: "capture", label: "Capture", icon: Code2 },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings2 },
  { id: "billing", label: "Billing", icon: CreditCard },
];

function SectionHeading({
  id,
  icon: Icon,
  title,
  subtitle,
}: {
  id: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
}) {
  return (
    <div id={id} className="flex items-start gap-3 mb-5 scroll-mt-6">
      <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-cv-primary-soft">
        <Icon className="h-4 w-4 text-cv-primary" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

function InfoCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
      {children}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-cv-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[#dce5ff] bg-cv-surface-blue px-4 py-3 text-sm text-cv-ink">
      <span className="font-semibold text-cv-primary-dark">Tip: </span>
      {children}
    </div>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
      {children}
    </p>
  );
}

export default function HelpPage() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Help & Guide</h1>
        <p className="text-sm text-slate-500">A plain-English walkthrough of Callverted.</p>
      </div>

      <div className="flex gap-8 items-start">
        {/* Sticky sidebar, desktop only */}
        <aside className="hidden lg:block w-48 flex-shrink-0 sticky top-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">On this page</p>
          <nav className="space-y-0.5">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <s.icon className="h-3.5 w-3.5 flex-shrink-0" />
                {s.label}
              </a>
            ))}
          </nav>
          <div className="mt-6 border-t border-slate-200 pt-4">
            <p className="text-xs text-slate-400 mb-1">Still stuck?</p>
            <a href="mailto:support@callverted.com" className="text-xs font-medium text-cv-primary hover:underline">
              Email support →
            </a>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-10">

          {/* ── GETTING STARTED ── */}
          <section>
            <SectionHeading
              id="getting-started"
              icon={Rocket}
              title="Getting Started"
              subtitle="What Callverted does and what to set up first."
            />
            <div className="space-y-4">
              <InfoCard>
                <SubHeading>What Callverted is</SubHeading>
                <p className="text-sm text-slate-600">
                  Callverted is an AI voice-overflow receptionist for home-service trades: restoration, HVAC, plumbing, electrical, general contracting, and other service businesses. When a call to your business goes unanswered (or every call, depending on your settings), Callverted picks up, asks a short set of qualifying questions for your trade, and turns the answers into a scored lead. Leads also arrive from a public intake form and an embeddable website widget, not just phone calls.
                </p>
              </InfoCard>
              <InfoCard>
                <SubHeading>Signing up</SubHeading>
                <BulletList items={[
                  "Enter your business name and contact info.",
                  "Pick your trade: this determines the qualifying questions callers are asked and how leads are scored.",
                  "Get a dedicated Callverted phone number for overflow calls.",
                  "Start your free trial and land in the dashboard.",
                ]} />
              </InfoCard>
              <InfoCard>
                <SubHeading>Before you go live</SubHeading>
                <BulletList items={[
                  "Add your services and preliminary pricing in Settings so the AI has real numbers to read back to callers.",
                  "Set your call routing: how long your team rings before Callverted takes over, and what it says.",
                  "Share your intake link or add the website widget so leads can reach you outside of phone calls too.",
                ]} />
                <Tip>The AI only ever reads back pricing wording you&apos;ve approved. It never invents a number, so it&apos;s worth setting up pricing rules before your line goes live.</Tip>
              </InfoCard>
            </div>
          </section>

          {/* ── DASHBOARD ── */}
          <section>
            <SectionHeading
              id="dashboard"
              icon={LayoutDashboard}
              title="Dashboard"
              subtitle="Your home screen for what needs attention right now."
            />
            <div className="space-y-4">
              <InfoCard>
                <SubHeading>Status pills</SubHeading>
                <p className="text-sm text-slate-600">
                  At the top you&apos;ll see whether your voice line is live, whether the website widget has been used yet, and a callout if any urgent leads are waiting on a callback.
                </p>
              </InfoCard>
              <InfoCard>
                <SubHeading>Metrics</SubHeading>
                <BulletList items={[
                  "Captured opportunity value: the combined estimated value of qualified leads this month.",
                  "Confirmed won revenue: actual amounts your team has reported for won leads, with a trend vs. last period.",
                  "Urgent awaiting callback: how many high-urgency leads haven't been contacted, and how long the oldest has waited.",
                  "Average callback time: how quickly your team typically responds, compared with the previous 30 days.",
                ]} />
              </InfoCard>
              <InfoCard>
                <SubHeading>Priority leads and conversion snapshot</SubHeading>
                <p className="text-sm text-slate-600">
                  The priority list ranks leads by urgency, intent, and how long they&apos;ve been waiting, so you know who to call first. The conversion snapshot shows your captured → contacted → booked → won rates and a breakdown of leads by channel.
                </p>
              </InfoCard>
            </div>
          </section>

          {/* ── LEADS ── */}
          <section>
            <SectionHeading
              id="leads"
              icon={Inbox}
              title="Leads"
              subtitle="Every captured opportunity, from calls, forms, and manual entry."
            />
            <div className="space-y-4">
              <InfoCard>
                <SubHeading>Lead statuses</SubHeading>
                <BulletList items={[
                  "New: just captured, awaiting a callback.",
                  "Contacted: you've reached out.",
                  "Qualified: you've confirmed it's a real opportunity.",
                  "Booked: an appointment is on the books.",
                  "Estimate sent: you've quoted the job in person or over the phone.",
                  "Won: the job closed.",
                  "Lost: didn't convert.",
                ]} />
                <p className="text-sm text-slate-500 pt-1">
                  You move a lead through these stages yourself from the lead detail page. Nothing advances automatically.
                </p>
              </InfoCard>
              <InfoCard>
                <SubHeading>Priority and intent</SubHeading>
                <p className="text-sm text-slate-600">
                  Every completed intake is scored by AI on two dimensions. Priority reflects urgency (<span className="font-medium">Urgent</span>, <span className="font-medium">Call today</span>, or <span className="font-medium">Routine</span>), and intent reflects how likely the caller is to move forward (<span className="font-medium">High intent</span>, <span className="font-medium">Medium intent</span>, or <span className="font-medium">Intent unclear</span>). Use these to decide who to call back first.
                </p>
              </InfoCard>
              <InfoCard>
                <SubHeading>Lead detail page</SubHeading>
                <BulletList items={[
                  "Opportunity summary: the AI's reasoning behind the urgency and quality scores, plus recommended next actions.",
                  "Qualification answers: the trade-specific questions the caller answered.",
                  "Call evidence: the call summary and full transcript, if the lead came from a phone call. Leads from the intake form or widget won't have a transcript.",
                  "Timeline: a chronological record of everything that's happened on the lead.",
                  "Update outcome: set the status, log a confirmed job value once you know the real number, and leave an internal note for your team.",
                ]} />
              </InfoCard>
              <InfoCard>
                <SubHeading>Filtering and adding leads</SubHeading>
                <p className="text-sm text-slate-600">
                  Filter the leads list by status, source, priority, or search by name or phone number. Use <span className="font-medium">Add lead</span> to manually log an opportunity that didn&apos;t come through Callverted: a walk-in, a referral, or a call you took yourself.
                </p>
              </InfoCard>
            </div>
          </section>

          {/* ── CALLS ── */}
          <section>
            <SectionHeading
              id="calls"
              icon={Phone}
              title="Calls"
              subtitle="Every inbound call to your Callverted number."
            />
            <div className="space-y-4">
              <InfoCard>
                <SubHeading>Call outcomes</SubHeading>
                <BulletList items={[
                  "Business answered: your team picked up before Callverted stepped in.",
                  "Captured by Callverted: no one answered in time, so the AI took the call and ran qualification.",
                  "Caller abandoned: the caller hung up before completing the intake questions.",
                  "Error: the call transfer failed.",
                ]} />
              </InfoCard>
              <InfoCard>
                <SubHeading>Call details</SubHeading>
                <p className="text-sm text-slate-600">
                  Click <span className="font-medium">Details</span> on any call to expand its AI-generated summary and full turn-by-turn transcript in place. There&apos;s no audio recording playback in the dashboard: call evidence is text only.
                </p>
              </InfoCard>
              <InfoCard>
                <SubHeading>Metrics and filtering</SubHeading>
                <p className="text-sm text-slate-600">
                  The top of the page shows total inbound calls, how many your team answered directly, how many Callverted captured, and your caller completion rate (the share of AI-answered calls that finished enough of the intake to become a lead). Filter by outcome or search by caller number.
                </p>
              </InfoCard>
            </div>
          </section>

          {/* ── CAPTURE ── */}
          <section>
            <SectionHeading
              id="capture"
              icon={Code2}
              title="Capture"
              subtitle="The three ways leads reach you."
            />
            <div className="space-y-4">
              <InfoCard>
                <SubHeading>Direct intake link</SubHeading>
                <p className="text-sm text-slate-600">
                  A public qualification form hosted at your own URL. Share it in ads, email signatures, or your Google Business Profile. Copy the link from the Capture page.
                </p>
              </InfoCard>
              <InfoCard>
                <SubHeading>Website widget</SubHeading>
                <p className="text-sm text-slate-600">
                  An embeddable snippet you add to your existing website so visitors can get qualified without leaving your site. Copy the embed code from the Capture page.
                </p>
              </InfoCard>
              <InfoCard>
                <SubHeading>Voice overflow</SubHeading>
                <p className="text-sm text-slate-600">
                  Calls to your Callverted number that go unanswered by your team. Configure how it rings and answers in Settings → Call setup.
                </p>
                <Tip>All three channels run the same qualifying questions and pricing rules, and every lead lands in the same place: your Leads list.</Tip>
              </InfoCard>
            </div>
          </section>

          {/* ── REPORTS ── */}
          <section>
            <SectionHeading
              id="reports"
              icon={BarChart3}
              title="Reports"
              subtitle="How captured opportunities turn into revenue."
            />
            <div className="space-y-4">
              <InfoCard>
                <SubHeading>Conversion funnel</SubHeading>
                <p className="text-sm text-slate-600">
                  Tracks leads from captured through qualified, contacted, and won, and calls out the stage with the biggest drop-off so you know where to focus.
                </p>
              </InfoCard>
              <InfoCard>
                <SubHeading>Captured vs. won</SubHeading>
                <p className="text-sm text-slate-600">
                  A daily chart comparing leads captured against leads won, over the last 14, 30, or 90 days.
                </p>
              </InfoCard>
              <InfoCard>
                <SubHeading>Performance by channel</SubHeading>
                <p className="text-sm text-slate-600">
                  Breaks down leads, wins, and confirmed revenue by source (voice overflow, website widget, direct intake, or manual entry) so you can see which channel is actually paying off.
                </p>
              </InfoCard>
            </div>
          </section>

          {/* ── SETTINGS ── */}
          <section>
            <SectionHeading
              id="settings"
              icon={Settings2}
              title="Settings"
              subtitle="Call routing, pricing, notifications, and your business profile."
            />
            <div className="space-y-4">
              <InfoCard>
                <SubHeading>Call setup</SubHeading>
                <p className="text-sm text-slate-600">
                  Set the number your team&apos;s calls forward to, how long it rings before Callverted takes over, and whether Callverted rings alongside your team first or answers immediately. You can also customize the AI&apos;s greeting, choose its voice, set an urgent transfer number for live emergency transfers, add extra instructions for the AI, and optionally enable call recording with a spoken disclosure.
                </p>
              </InfoCard>
              <InfoCard>
                <SubHeading>Services & pricing</SubHeading>
                <p className="text-sm text-slate-600">
                  Add a pricing rule per service: a range, a fixed price, a starting-at price, or &quot;inspection required.&quot; Whatever wording that produces is exactly what the AI reads back to callers on the phone. It never estimates or invents a number on its own.
                </p>
              </InfoCard>
              <InfoCard>
                <SubHeading>Notifications</SubHeading>
                <p className="text-sm text-slate-600">
                  Choose whether you get an email for every qualified lead and whether you receive a weekly performance recap. Notifications are sent by email; there&apos;s no SMS notification option currently.
                </p>
              </InfoCard>
              <InfoCard>
                <SubHeading>Business profile</SubHeading>
                <p className="text-sm text-slate-600">
                  Update your business name, owner name, service area, and website. Your trade (vertical) is set during onboarding and shown here, since it determines your qualifying questions.
                </p>
              </InfoCard>
            </div>
          </section>

          {/* ── BILLING ── */}
          <section>
            <SectionHeading
              id="billing"
              icon={CreditCard}
              title="Billing"
              subtitle="Manage your subscription from Settings → Billing."
            />
            <div className="space-y-4">
              <InfoCard>
                <SubHeading>Plan</SubHeading>
                <p className="text-sm text-slate-600">
                  Callverted is one plan: <span className="font-semibold">$149/month</span>, with a 14-day free trial. It includes AI voice overflow, the public intake form and website widget, AI-driven lead scoring with reasoning and recommended actions, business-approved pricing rules, the full lead dashboard, and email alerts on qualified leads plus a weekly recap. No add-ons, no lead caps.
                </p>
              </InfoCard>
              <InfoCard>
                <SubHeading>Managing your subscription</SubHeading>
                <BulletList items={[
                  "Open the Billing tab in Settings and click Manage subscription to reach the Stripe billing portal.",
                  "From there you can update your payment method, view invoices, or cancel.",
                  "Cancellation takes effect at the end of your current billing period.",
                  "Your leads and data are preserved if you come back.",
                ]} />
              </InfoCard>
            </div>
          </section>

          {/* Footer */}
          <div className="border-t border-slate-200 pt-8">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 flex items-start gap-3">
              <Star className="h-4 w-4 text-cv-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Still have a question?</p>
                <p className="text-sm text-slate-500 mt-0.5">
                  Email us at{" "}
                  <a href="mailto:support@callverted.com" className="text-cv-primary hover:underline">
                    support@callverted.com
                  </a>{" "}
                  and we&apos;ll get back to you quickly.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
