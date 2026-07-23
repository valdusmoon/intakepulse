import {
  Rocket,
  LayoutDashboard,
  Inbox,
  Gauge,
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
  { id: "leads", label: "Leads & Messages", icon: Inbox },
  { id: "ranking", label: "How Ranking Works", icon: Gauge },
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
                  Callverted captures every inbound opportunity for a home-service business (restoration, HVAC, plumbing, electrical, general contracting, and other trades), sorts the real jobs from the messages and the junk, and puts the real jobs in a ranked callback list so your team knows who to call first. Calls your team doesn&apos;t get to are answered by an automated assistant that asks a few short questions and turns the answers into a scored lead. If you turn on call recording, the calls your team <span className="font-medium">does</span> answer are transcribed and captured the same way. Leads also arrive from your public intake link and your website widget.
                </p>
              </InfoCard>
              <InfoCard>
                <SubHeading>What it deliberately does not do</SubHeading>
                <BulletList items={[
                  "It is not a receptionist. The assistant never answers open-ended questions, never invents a price, and never books an appointment.",
                  "It never transfers a caller to a person. Someone who asks for a human becomes a callback message instead, so your team calls them back.",
                  "It is not a CRM. Each contact is one record. There is no customer history, no repeat-caller matching, no contact threads.",
                  "The AI only listens, sorts, and summarizes. Fixed code decides what happens on the call and what gets saved.",
                ]} />
              </InfoCard>
              <InfoCard>
                <SubHeading>Signing up</SubHeading>
                <BulletList items={[
                  "Enter your business name, your name, email, phone, and service area.",
                  "Pick your trade. It sets your service list, your pricing categories, and the job-value benchmarks used for ranking.",
                  "Add a card and start the 14-day free trial.",
                  "Choose your Callverted number by area code. Pick one close to your service area, because that is the number you will publish.",
                ]} />
              </InfoCard>
              <InfoCard>
                <SubHeading>Before you go live</SubHeading>
                <BulletList items={[
                  "Run a test call. On the Test call page you type what a caller would say and watch the exact conversation, scoring, and lead a real call would produce. No phone needed.",
                  "Add your services and prices in Settings so the assistant has approved wording to read back, and so your lead value estimates match what you actually charge.",
                  "Set the number your calls forward to in Settings → Call setup.",
                  "Turn on push alerts on your phone in Settings → Notifications so a new lead reaches you in seconds.",
                  "Publish your Callverted number where customers find you: Google Business Profile, your website, Facebook, and directories.",
                ]} />
                <Tip>Your Callverted number rings your own line first for about 15 seconds. The assistant only picks up when nobody does, so publishing it does not change who normally answers your phone.</Tip>
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
                  At the top you&apos;ll see whether your voice line is live, whether the website widget has been used yet, how many leads are waiting on a callback, and how many new messages are unread. If you haven&apos;t added a card yet, a &quot;setup mode&quot; pill appears instead, because the line can&apos;t answer real calls until payment is on file.
                </p>
              </InfoCard>
              <InfoCard>
                <SubHeading>Metrics</SubHeading>
                <BulletList items={[
                  "Captured opportunity value: the combined estimated value of the jobs captured this month.",
                  "Confirmed won revenue: the amounts your team reported on leads marked won, with a trend against the previous period.",
                  "Urgent awaiting callback: how many urgent jobs still haven't been contacted, and how long the oldest has waited.",
                  "Average callback time: how long it takes you to mark a lead contacted, compared with the previous 30 days.",
                ]} />
                <p className="text-sm text-slate-500 pt-1">
                  Every metric on this page counts jobs only. Messages are deliberately left out so they can&apos;t inflate your numbers.
                </p>
              </InfoCard>
              <InfoCard>
                <SubHeading>Priority leads, conversion, and activity</SubHeading>
                <p className="text-sm text-slate-600">
                  The priority list ranks jobs by their priority score, so the top of the list is who to call first. The conversion snapshot shows your leads → contacted, contacted → booked, and booked → won rates over the last 90 days, built from the statuses you set yourself, plus a split of which channels your leads came from. Recent activity is a short feed of captured calls, won leads, and callers who hung up.
                </p>
              </InfoCard>
            </div>
          </section>

          {/* ── LEADS ── */}
          <section>
            <SectionHeading
              id="leads"
              icon={Inbox}
              title="Leads & Messages"
              subtitle="Every captured contact, from calls, forms, and manual entry."
            />
            <div className="space-y-4">
              <InfoCard>
                <SubHeading>Three outcomes, one per contact</SubHeading>
                <BulletList items={[
                  "Job: someone with real work for you. It gets scored, ranked in your callback queue, and counted in every metric and report.",
                  "Message: everything else worth knowing about, tagged as existing customer, billing, callback, question, or general. It is captured and you're alerted, but it is never scored and never counted in your job metrics.",
                  "Junk: wrong numbers and solicitations. No lead is created at all. The call itself still shows on the Calls page as screened, so you can check nothing real was thrown away.",
                ]} />
                <p className="text-sm text-slate-500 pt-1">
                  The dividing line: describing a problem they actually have is a job. Asking what you charge without having a problem is a question, so it is filed as a message rather than scored on a job that may not exist. When the assistant isn&apos;t sure, it captures rather than screens.
                </p>
              </InfoCard>
              <InfoCard>
                <SubHeading>Flipping between job and message</SubHeading>
                <p className="text-sm text-slate-600">
                  You have the last word. On any lead page, <span className="font-medium">Convert to job</span> moves a message into your pipeline, and <span className="font-medium">File as message</span> pulls a job out of the ranked queue and out of your job metrics. It works in both directions, one tap each way. A promoted message stays unscored on purpose: we won&apos;t invent numbers for a job nobody qualified.
                </p>
              </InfoCard>
              <InfoCard>
                <SubHeading>Lead statuses</SubHeading>
                <BulletList items={[
                  "New: captured, not yet worked. This is what you see on messages and on any intake that didn't finish.",
                  "Qualified: a job that completed intake and was scored. Jobs land here automatically.",
                  "Contacted: you've reached out. This stamp is what your average callback time is measured from.",
                  "Booked: an appointment is on the books.",
                  "Estimate sent: you've quoted the job.",
                  "Won: the job closed.",
                  "Lost: it didn't convert.",
                ]} />
                <p className="text-sm text-slate-500 pt-1">
                  Apart from the automatic jump to Qualified when a job is scored, you move leads through these stages yourself from the lead page. Nothing else advances on its own.
                </p>
              </InfoCard>
              <InfoCard>
                <SubHeading>Lead detail page</SubHeading>
                <BulletList items={[
                  "Opportunity summary: plain-English reasoning for the urgency and quality scores, plus suggested next actions. The scores are computed by fixed rules; the AI only explains them.",
                  "Qualification answers: what was actually captured. A request that isn't on your service list shows the caller's own words and an \"Off your service list\" badge, and no price was quoted for it.",
                  "Call evidence: the summary and full turn-by-turn transcript when the lead came from a phone call. There is no audio to play back. Recordings are transcribed and then deleted.",
                  "Timeline: when the call came in, when intake finished or was abandoned, when you marked it contacted, and when you marked it won.",
                  "Update outcome: set the status, log the confirmed job value once you know the real number, and leave an internal note for your team.",
                ]} />
                <p className="text-sm text-slate-500 pt-1">
                  A message shows the note the caller left and its kind badge instead of scores, because there is nothing to score.
                </p>
              </InfoCard>
              <InfoCard>
                <SubHeading>Filtering, search, and adding leads</SubHeading>
                <p className="text-sm text-slate-600">
                  Filter the list by type (jobs or messages), priority, source, or status, and search by name or phone number. <span className="font-medium">Export</span> downloads exactly what your filters are showing as a spreadsheet file. Use <span className="font-medium">Add lead</span> to log an opportunity that never came through Callverted: a walk-in, a referral, or a call you took on your cell.
                </p>
              </InfoCard>
            </div>
          </section>

          {/* ── RANKING ── */}
          <section>
            <SectionHeading
              id="ranking"
              icon={Gauge}
              title="How Ranking Works"
              subtitle="What Hot, Warm, and Cool actually mean."
            />
            <div className="space-y-4">
              <InfoCard>
                <SubHeading>The priority score</SubHeading>
                <p className="text-sm text-slate-600">
                  Every job gets one priority score from 0 to 100: half of it is urgency, three tenths is estimated value, and two tenths is how complete the capture is. <span className="font-medium">Hot</span> is 65 and up, <span className="font-medium">Warm</span> is 40 to 64, and everything else is <span className="font-medium">Cool</span>. The badge always comes from the combined score, never from one piece of it. Messages have no score and show their message kind instead.
                </p>
              </InfoCard>
              <InfoCard>
                <SubHeading>Urgency</SubHeading>
                <p className="text-sm text-slate-600">
                  Comes from what the caller said about timing, plus the kind of work (a burst pipe or a sewer line counts for more than a thermostat). A stated emergency with a clear service always lands in the Hot band, and explicit critical language such as a gas smell, active flooding, or a sewage backup lands higher still. Emergencies are still ordered against each other inside that band, so five emergencies rank in a sensible order instead of tying. &quot;Emergency&quot; with no idea what the job is does not float to Hot.
                </p>
              </InfoCard>
              <InfoCard>
                <SubHeading>Estimated value</SubHeading>
                <p className="text-sm text-slate-600">
                  A back-office number used for ranking, alerts, and reports. It is never spoken to a caller. Callverted uses the most specific truth it has, in this order:
                </p>
                <BulletList items={[
                  "A price your team quoted on a recorded call. Your own words beat any estimate.",
                  "The price you configured for that service in Settings.",
                  "An industry benchmark scaled to your pricing, when you priced other services but not this one.",
                  "The plain industry benchmark for your trade.",
                  "For a job that isn't on your list at all, an AI estimate that weighs the described work against your own price list. It is skipped whenever there's real doubt.",
                  "The base range for your trade, when nothing above applies.",
                ]} />
                <p className="text-sm text-slate-500 pt-1">
                  The more services you price in Settings, the closer these estimates get to your real work. A big job that isn&apos;t urgent stays Cool and picks up a separate <span className="font-medium">High value</span> badge, rather than jumping the queue ahead of an emergency.
                </p>
              </InfoCard>
              <InfoCard>
                <SubHeading>Quality means completeness</SubHeading>
                <p className="text-sm text-slate-600">
                  Quality measures how complete and qualified the capture is, not how urgent or how big the job is. Points come from having the service identified, the ZIP, an urgency answer, coverage (insurance, warranty, financing, or out of pocket), how recently it came up, and a name or email. On the leads list it reads as <span className="font-medium">Fully qualified</span>, <span className="font-medium">Solid details</span>, <span className="font-medium">Partial details</span>, or <span className="font-medium">Sparse details</span>.
                </p>
                <Tip>A perfect phone capture scores about 65 here and a fully filled-in web form reaches 100. That is intentional: a phone call asks fewer questions on purpose, so a good call is never penalized for the questions it deliberately skipped.</Tip>
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
                <SubHeading>What a caller actually hears</SubHeading>
                <p className="text-sm text-slate-600">
                  The assistant answers with your business name, says plainly that it is automated, and asks what&apos;s going on. From there a job call asks exactly three things: what happened, the ZIP code where the work is needed, and how urgent it is. If you have approved pricing for that service, it reads your wording back word for word. If you don&apos;t, it says the team will review the details before discussing pricing. Then it confirms what it noted and promises a callback.
                </p>
                <BulletList items={[
                  "It never asks for a phone number. That comes from caller ID.",
                  "It never asks for a name on a job call. Speech-to-text mangles names, a wrong name is worse than none, and the callback goes to caller ID anyway. A name is kept if the caller offers one. The message path does ask for a name, since knowing who left a message is the whole point.",
                  "There is no \"when should we call you back\" question. Your team works the ranked queue instead.",
                  "Calls wrap up gracefully at around three minutes with whatever was captured, and no caller is ever dumped into voicemail.",
                ]} />
              </InfoCard>
              <InfoCard>
                <SubHeading>Call outcomes</SubHeading>
                <BulletList items={[
                  "Business answered: your team picked up before Callverted stepped in.",
                  "Captured by Callverted: nobody answered in time, so the assistant took the call and ran intake.",
                  "Caller abandoned: the caller hung up before finishing.",
                  "Screened: a wrong number or a solicitation. No lead was created, and the reason is shown on the row.",
                ]} />
                <p className="text-sm text-slate-500 pt-1">
                  Older accounts may still see a &quot;Transferred to team&quot; outcome on historical calls. Callverted no longer bridges a caller to a person under any circumstances.
                </p>
              </InfoCard>
              <InfoCard>
                <SubHeading>Calls your team answers</SubHeading>
                <p className="text-sm text-slate-600">
                  With recording switched on, the calls your team answers are recorded, transcribed, and sorted exactly like an AI-handled call, so an answered call still becomes a job, a message, or nothing. Your spoken disclosure plays on both the team line and the assistant line. These calls send no alert, because someone was already on the phone with the customer.
                </p>
                <p className="text-sm text-slate-600">
                  The audio is transcribed and then deleted. Only the text transcript and the summary are kept, so there is never a recording to play back or to store.
                </p>
              </InfoCard>
              <InfoCard>
                <SubHeading>Call details, metrics, and filtering</SubHeading>
                <p className="text-sm text-slate-600">
                  Click <span className="font-medium">Details</span> on any call to expand its summary and full transcript in place. AI-handled calls always have a transcript; team-answered calls only have one when recording is on. The metrics at the top are total inbound calls, how many your team answered, how many Callverted captured, and your caller completion rate (the share of AI-handled calls that produced a lead or reached your team). Filter by outcome, search by caller number, or export the list.
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
                  A public qualification form at your own Callverted URL. It collects name, phone, email (optional), and ZIP, then walks through your trade&apos;s questions, including a &quot;Something else&quot; option for work that isn&apos;t on your list. Share it in ads, email signatures, or your Google Business Profile. Copy the link from the Capture page.
                </p>
              </InfoCard>
              <InfoCard>
                <SubHeading>Website widget</SubHeading>
                <p className="text-sm text-slate-600">
                  An embeddable snippet you paste into your existing website so visitors can get qualified without leaving your site. It runs the same form. Copy the embed code from the Capture page.
                </p>
              </InfoCard>
              <InfoCard>
                <SubHeading>Voice</SubHeading>
                <p className="text-sm text-slate-600">
                  Calls to your Callverted number. By default your own line rings first and the assistant only steps in when nobody answers, but you can set it to answer immediately in Settings → Call setup.
                </p>
                <Tip>All three channels run the same question set and the same approved pricing, and everything lands in your Leads list. The web form asks more questions than a phone call does on purpose, and the scoring accounts for that so no channel is punished for it.</Tip>
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
                  Tracks leads from captured through qualified, contacted, and won over the last 14, 30, or 90 days, and calls out the stage with the biggest drop-off so you know where to focus.
                </p>
              </InfoCard>
              <InfoCard>
                <SubHeading>Captured vs. won</SubHeading>
                <p className="text-sm text-slate-600">
                  A daily chart comparing leads captured against leads won across the range you pick.
                </p>
              </InfoCard>
              <InfoCard>
                <SubHeading>Performance by channel</SubHeading>
                <p className="text-sm text-slate-600">
                  Breaks down leads, wins, and revenue by source (recovered by AI, answered by team, website widget, direct intake, or manual entry) so you can see which channel is actually paying off. Revenue uses your confirmed job value where you reported one, and the estimate where you haven&apos;t.
                </p>
                <p className="text-sm text-slate-500 pt-1">
                  Reports count jobs only. Messages are excluded everywhere, and the <span className="font-medium">Export</span> button downloads whatever range you&apos;re viewing.
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
                  Set the number your calls forward to (your office, your cell, or your existing business line) and choose whether Callverted rings your team first or answers immediately. Ring time is a fixed 15 seconds and the assistant&apos;s voice is a fixed product setting; neither is adjustable today. The same tab holds <span className="font-medium">Record &amp; transcribe calls</span>, which is what makes team-answered calls get captured as leads. Turning it on requires a spoken disclosure, which plays on both lines. Some states require every party to consent, and the wording you use is your responsibility.
                </p>
              </InfoCard>
              <InfoCard>
                <SubHeading>Services &amp; pricing</SubHeading>
                <p className="text-sm text-slate-600">
                  Add one entry per service: a range, a fixed price, a starting-at price, or &quot;inspection required.&quot; The card shows you exactly what a caller will hear, and the assistant reads that wording word for word. It never composes a number of its own. If a service has no approved wording, callers are told the team will review the details before discussing pricing.
                </p>
                <p className="text-sm text-slate-600">
                  You can type a service that isn&apos;t in your trade&apos;s preset list and it becomes selectable on calls and on the form too. These prices are also the first source for the estimated value on your leads, so the more you price here, the more your ranking reflects your real work.
                </p>
              </InfoCard>
              <InfoCard>
                <SubHeading>Notifications</SubHeading>
                <p className="text-sm text-slate-600">
                  Set the email and mobile number you want on file, then choose what you get alerted about: every qualified lead, messages, and the weekly recap. Alerts go out as a phone push and an email. There is no SMS alert to you.
                </p>
                <p className="text-sm text-slate-600">
                  <span className="font-medium">Push alerts on this device</span> is separate and per device, so switch it on for each phone or computer you want alerted. On an iPhone, add Callverted to your Home Screen first (Share → Add to Home Screen) and open it from there, otherwise iOS will not allow push notifications at all.
                </p>
              </InfoCard>
              <InfoCard>
                <SubHeading>Business profile</SubHeading>
                <p className="text-sm text-slate-600">
                  Update your business name, owner name, service area, and timezone. Call times, reports, and emails are all shown in the timezone you set here. Your trade is shown on this tab but is chosen during onboarding, since it determines your questions, your service list, and your value benchmarks.
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
                  One plan, two ways to pay: <span className="font-semibold">$149/month</span>, or <span className="font-semibold">$1,499/year</span>, which works out to $125 a month and saves $289 over paying monthly. Both start with a 14-day free trial and include everything: AI call capture, recording and transcription of answered calls, the intake link and website widget, scoring with reasoning and suggested actions, approved pricing rules, the full dashboard and reports, and push plus email alerts with a weekly recap. No add-ons, no lead caps.
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
              <InfoCard>
                <SubHeading>If billing lapses</SubHeading>
                <p className="text-sm text-slate-600">
                  An expired trial or a failed payment stops your line answering, and callers hear a short &quot;temporarily unavailable&quot; message instead. If a card fails we email you a link to update it. Sorting the payment out turns the line straight back on.
                </p>
                <p className="text-sm text-slate-500 pt-1">
                  If you cancel outright, your Callverted number is released at the end of the billing period and cannot be recovered, so take it off your truck and listings first. Your leads, calls, and history stay in your account.
                </p>
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
