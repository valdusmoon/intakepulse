import {
  Rocket,
  QrCode,
  Inbox,
  FileText,
  FileSignature,
  CalendarDays,
  Camera,
  Bell,
  Code2,
  Star,
  Settings2,
  CreditCard,
  Palette,
} from "lucide-react";

const sections = [
  { id: "getting-started", label: "Getting Started", icon: Rocket },
  { id: "quote-link", label: "Quote Link & QR", icon: QrCode },
  { id: "leads", label: "Leads", icon: Inbox },
  { id: "quotes", label: "Quotes", icon: FileText },
  { id: "contracts", label: "Contracts", icon: FileSignature },
  { id: "scheduling", label: "Scheduling", icon: CalendarDays },
  { id: "job-photos", label: "Job Photos", icon: Camera },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "website-widget", label: "Website Widget", icon: Code2 },
  { id: "review-requests", label: "Review Requests", icon: Star },
  { id: "visualization", label: "Visualization", icon: Palette },
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
      <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-orange-100">
        <Icon className="h-4 w-4 text-orange-500" />
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
          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-orange-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <span className="font-semibold">Tip: </span>
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
        {/* Sticky sidebar — desktop only */}
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
            <a href="mailto:support@callverted.com" className="text-xs font-medium text-orange-500 hover:underline">
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
              subtitle="What to do right after you sign up."
            />
            <div className="space-y-4">
              <InfoCard>
                <SubHeading>Setup</SubHeading>
                <p className="text-sm text-slate-600">
                  After signing up you&apos;ll complete a one-time onboarding form before accessing the dashboard.
                </p>
                <BulletList items={[
                  "Enter your business name, mobile number, and service area.",
                  "Set your default sqft labor rate and paint tier — used to generate instant estimates for homeowners.",
                  "You can update any of these anytime in Settings.",
                ]} />
              </InfoCard>
              <InfoCard>
                <SubHeading>Your first lead</SubHeading>
                <BulletList items={[
                  "After onboarding, copy your quote link from the dashboard.",
                  "Share it anywhere — text it to a homeowner, add it to your Google Business Profile, or print the QR code.",
                  "When a homeowner fills it out, you'll get an email and SMS notification immediately.",
                ]} />
                <Tip>The faster you share your link, the faster your first lead comes in. Most contractors get their first lead within 24 hours of sharing.</Tip>
              </InfoCard>
            </div>
          </section>

          {/* ── QUOTE LINK & QR ── */}
          <section>
            <SectionHeading
              id="quote-link"
              icon={QrCode}
              title="Quote Link & QR Code"
              subtitle="How homeowners find and fill out your form."
            />
            <div className="space-y-4">
              <InfoCard>
                <SubHeading>What the form does</SubHeading>
                <p className="text-sm text-slate-600">
                  Your quote link leads homeowners through a step-by-step form — service type, room count, home size, condition, and timeline. At the end they enter their contact info and optionally upload photos. Callverted generates an instant ballpark estimate based on your rates.
                </p>
              </InfoCard>
              <InfoCard>
                <SubHeading>Where to share your link</SubHeading>
                <BulletList items={[
                  "Google Business Profile — add it as your website or booking link.",
                  "Instagram / Facebook bio.",
                  "Text it directly to homeowners who reach out.",
                  "Include it in email signatures.",
                  "Nextdoor profile or neighborhood group posts.",
                ]} />
              </InfoCard>
              <InfoCard>
                <SubHeading>QR code</SubHeading>
                <p className="text-sm text-slate-600">
                  Download your QR code from the dashboard. It links directly to your quote form.
                </p>
                <BulletList items={[
                  "Job site signs — homeowners in the neighborhood scan while you're working.",
                  "Truck decals or door magnets.",
                  "Leave-behind cards after completing a job.",
                  "Yard signs with the homeowner's permission.",
                ]} />
                <Tip>Job site visibility is one of the highest-converting placements — neighbors see your work in progress and scan right there.</Tip>
              </InfoCard>
            </div>
          </section>

          {/* ── LEADS ── */}
          <section>
            <SectionHeading
              id="leads"
              icon={Inbox}
              title="Leads"
              subtitle="Managing the homeowners who fill out your form."
            />
            <div className="space-y-4">
              <InfoCard>
                <SubHeading>Lead statuses</SubHeading>
                <BulletList items={[
                  "New — homeowner just submitted the form.",
                  "Contacted — you've reached out to them.",
                  "Quoted — a quote has been sent.",
                  "Scheduled — contract signed, job is on the calendar.",
                  "Won — contract signed via Callverted (set automatically).",
                  "Completed — job physically done. Set this manually to trigger the review request email.",
                  "Lost — didn't convert. Set manually or triggered automatically if they decline your quote.",
                ]} />
                <p className="text-sm text-slate-500 pt-1">
                  Statuses update automatically as you send quotes and contracts — you rarely need to touch them manually. <span className="font-medium">Completed</span> is the one you set when the brushes are down.
                </p>
              </InfoCard>
              <InfoCard>
                <SubHeading>Mark as won</SubHeading>
                <p className="text-sm text-slate-600">
                  If you close a job over the phone without a formal quote or contract, use the <span className="font-medium">Mark as won</span> button on the lead detail page. You can optionally enter the job amount — it&apos;ll appear in your revenue numbers.
                </p>
              </InfoCard>
              <InfoCard>
                <SubHeading>Instant estimate</SubHeading>
                <p className="text-sm text-slate-600">
                  If a homeowner answers all questions, Callverted generates a ballpark range based on your sqft rate, home size, condition, and paint tier. This shows on the lead detail page and is sent to the homeowner in their confirmation email.
                </p>
                <p className="text-sm text-slate-500 pt-1">
                  The estimate is a ballpark only — always verify on-site before sending a formal quote.
                </p>
              </InfoCard>
              <InfoCard>
                <SubHeading>Photo analysis</SubHeading>
                <p className="text-sm text-slate-600">
                  If the homeowner uploads photos, GPT-4o Vision analyzes them and writes condition notes you&apos;ll see on the lead detail page. Useful for scoping the job before you call.
                </p>
              </InfoCard>
              <InfoCard>
                <SubHeading>Request more details</SubHeading>
                <p className="text-sm text-slate-600">
                  If a homeowner only partially filled out the form, you can send them a follow-up email from the lead detail page asking them to complete it. The button only shows when the homeowner skipped the project details step.
                </p>
              </InfoCard>
              <InfoCard>
                <SubHeading>Email required for quotes & contracts</SubHeading>
                <p className="text-sm text-slate-600">
                  Quotes and contracts are sent by email, so the homeowner needs an email address on file. If one is missing you&apos;ll see an amber banner at the top of the lead — enter it there and the buttons will activate.
                </p>
              </InfoCard>
            </div>
          </section>

          {/* ── QUOTES ── */}
          <section>
            <SectionHeading
              id="quotes"
              icon={FileText}
              title="Quotes"
              subtitle="Build and send professional quotes directly from the lead."
            />
            <div className="space-y-4">
              <InfoCard>
                <SubHeading>Creating a quote</SubHeading>
                <p className="text-sm text-slate-600">
                  Open a lead and click <span className="font-medium">Quote</span>. Choose a template (Interior, Exterior, Interior + Exterior, or Custom) to pre-load common line items, then edit quantities and prices.
                </p>
                <BulletList items={[
                  "Add or remove line items as needed.",
                  "Set a flat or percentage discount.",
                  "Add a tax rate if applicable.",
                  "Set issue date and expiry date.",
                  "Add a message to the homeowner and an optional deposit note.",
                  "Internal notes are for you only — the homeowner never sees them.",
                ]} />
              </InfoCard>
              <InfoCard>
                <SubHeading>Sending a quote</SubHeading>
                <p className="text-sm text-slate-600">
                  Click <span className="font-medium">Send Quote</span>. The homeowner receives an email with a link to a hosted quote page where they can review the full breakdown and accept or decline.
                </p>
                <BulletList items={[
                  "You can save a draft first and come back to it.",
                  "Once sent, you can resend at any time (e.g. after a verbal price change).",
                  "You'll see when the homeowner views the quote.",
                  "Download a PDF copy at any time from the quote page.",
                ]} />
                <Tip>Prices are always recalculated server-side when you save — the homeowner always sees accurate numbers even if you edit after sending.</Tip>
              </InfoCard>
              <InfoCard>
                <SubHeading>When the homeowner responds</SubHeading>
                <BulletList items={[
                  "Accepted — the lead moves to Quoted. Send a contract to close the job.",
                  "Declined — the lead moves to Lost. You can still reach out manually.",
                ]} />
              </InfoCard>
              <InfoCard>
                <SubHeading>Voiding a quote</SubHeading>
                <p className="text-sm text-slate-600">
                  If a homeowner wants a revised price after you&apos;ve already sent a quote, void it and create a new one. Click <span className="font-medium">Void</span> on the quote page — the old link stops working and you&apos;ll be dropped into a blank editor for the new quote.
                </p>
                <p className="text-sm text-slate-500 pt-1">
                  You can void a quote that is sent or accepted. Voiding rewinds the lead status back to Contacted.
                </p>
              </InfoCard>
            </div>
          </section>

          {/* ── CONTRACTS ── */}
          <section>
            <SectionHeading
              id="contracts"
              icon={FileSignature}
              title="Contracts"
              subtitle="Send a service agreement and collect an electronic signature."
            />
            <div className="space-y-4">
              <InfoCard>
                <SubHeading>Creating a contract</SubHeading>
                <p className="text-sm text-slate-600">
                  Open a lead and click <span className="font-medium">Contract</span>. If you&apos;ve already sent a quote, the contract body is pre-filled with the line items, project total, and payment terms from that quote. Edit the text freely before sending.
                </p>
                <p className="text-sm text-slate-500 pt-1">
                  You don&apos;t need a quote to send a contract — useful for jobs you closed verbally.
                </p>
              </InfoCard>
              <InfoCard>
                <SubHeading>Sending a contract</SubHeading>
                <p className="text-sm text-slate-600">
                  Click <span className="font-medium">Send Contract</span>. The homeowner receives an email with a link to a signing page where they can read the full agreement and sign with their full name.
                </p>
                <BulletList items={[
                  "You'll see when the homeowner views the contract.",
                  "Once signed, you'll receive a signed PDF by email.",
                  "The lead moves to Scheduled automatically when signed.",
                  "You can resend the contract at any time.",
                ]} />
              </InfoCard>
              <InfoCard>
                <SubHeading>Electronic signatures</SubHeading>
                <p className="text-sm text-slate-600">
                  Signatures collected through Callverted are valid under the ESIGN Act. The signed PDF includes the signer&apos;s name, email, and timestamp as a record.
                </p>
              </InfoCard>
              <InfoCard>
                <SubHeading>Voiding a contract</SubHeading>
                <p className="text-sm text-slate-600">
                  If a job falls through after the contract was sent or signed, click <span className="font-medium">Void</span> on the contract page. The signing link stops working and you can draft a new contract if needed. Voiding rewinds the lead status back to Quoted.
                </p>
              </InfoCard>
            </div>
          </section>

          {/* ── SCHEDULING ── */}
          <section>
            <SectionHeading
              id="scheduling"
              icon={CalendarDays}
              title="Scheduling"
              subtitle="Set job dates, assign staff, and see everything on the calendar."
            />
            <div className="space-y-4">
              <InfoCard>
                <SubHeading>Scheduling a job</SubHeading>
                <p className="text-sm text-slate-600">
                  Open a lead and click <span className="font-medium">Schedule</span>. Set a start date, end date, and optionally assign staff members from your team. A confirmation email goes to the homeowner automatically.
                </p>
                <BulletList items={[
                  "You can also schedule directly from the Schedule page using the + Schedule job button — useful when you're planning your week.",
                  "You can reschedule at any time — the homeowner gets an updated confirmation.",
                  "Staff members are managed in Settings under the Staff tab.",
                ]} />
              </InfoCard>
              <InfoCard>
                <SubHeading>Calendar view</SubHeading>
                <p className="text-sm text-slate-600">
                  The calendar shows all scheduled jobs by date. Click any day to filter jobs to that date. Multi-day jobs show a dot on every day they span.
                </p>
              </InfoCard>
              <InfoCard>
                <SubHeading>Export to Google Calendar / Apple Calendar</SubHeading>
                <p className="text-sm text-slate-600">
                  Click <span className="font-medium">Export .ics</span> on the schedule page to download a calendar file containing all your scheduled jobs. Import it into Google Calendar, Apple Calendar, or Outlook.
                </p>
                <BulletList items={[
                  "Re-importing the same file won't create duplicates — each job has a stable unique ID.",
                  "Re-export whenever you add or reschedule jobs to keep your external calendar current.",
                ]} />
              </InfoCard>
            </div>
          </section>

          {/* ── JOB PHOTOS ── */}
          <section>
            <SectionHeading
              id="job-photos"
              icon={Camera}
              title="Job Photos"
              subtitle="Document before, progress, and after shots directly on the lead."
            />
            <div className="space-y-4">
              <InfoCard>
                <SubHeading>Uploading photos</SubHeading>
                <p className="text-sm text-slate-600">
                  On any lead detail page, scroll to the <span className="font-medium">Job Photos</span> section. Upload photos in three categories: Before, Progress, and After. Photos are stored securely and accessible only to your account.
                </p>
                <BulletList items={[
                  "Upload directly from your phone or computer.",
                  "Add as many photos as you need per category.",
                  "Delete individual photos at any time.",
                ]} />
              </InfoCard>
              <InfoCard>
                <SubHeading>Why document the job</SubHeading>
                <BulletList items={[
                  "Protects you if a homeowner disputes the quality of work.",
                  "Before/after comparisons are useful for your portfolio and reviews.",
                  "Progress photos keep a record if a job spans multiple days.",
                ]} />
                <Tip>Take an after photo before you pack up — you won&apos;t be going back to get it later.</Tip>
              </InfoCard>
            </div>
          </section>

          {/* ── NOTIFICATIONS ── */}
          <section>
            <SectionHeading
              id="notifications"
              icon={Bell}
              title="Notifications"
              subtitle="Stay in the loop on every key event — by email and SMS."
            />
            <div className="space-y-4">
              <InfoCard>
                <SubHeading>Your notifications (painter)</SubHeading>
                <p className="text-sm text-slate-600">
                  Callverted sends you email and SMS notifications for key events. You can toggle each on or off in <span className="font-medium">Settings → Notifications</span>.
                </p>
                <BulletList items={[
                  "New lead submitted — email + SMS.",
                  "Homeowner contacts you through the form — email + SMS.",
                  "Quote accepted or declined — email + SMS.",
                  "Contract signed — email + SMS.",
                  "Job scheduled — email + SMS.",
                  "Weekly nudge reminders for leads that need attention — email.",
                ]} />
              </InfoCard>
              <InfoCard>
                <SubHeading>Homeowner notifications</SubHeading>
                <p className="text-sm text-slate-600">
                  These emails always go out — they&apos;re part of the core workflow and can&apos;t be turned off.
                </p>
                <BulletList items={[
                  "Estimate confirmation after they submit the form.",
                  "Quote email with a link to review and accept or decline.",
                  "Contract email with a link to read and sign.",
                  "Schedule confirmation with the job date.",
                  "Review request email when you mark the job Completed.",
                ]} />
              </InfoCard>
              <InfoCard>
                <SubHeading>SMS delivery</SubHeading>
                <p className="text-sm text-slate-600">
                  SMS notifications go to the mobile number on your account. Make sure it&apos;s current in Settings. Standard carrier message rates may apply.
                </p>
              </InfoCard>
            </div>
          </section>

          {/* ── WEBSITE WIDGET ── */}
          <section>
            <SectionHeading
              id="website-widget"
              icon={Code2}
              title="Website Widget"
              subtitle="Embed your quote form directly on your website."
            />
            <div className="space-y-4">
              <InfoCard>
                <SubHeading>How it works</SubHeading>
                <p className="text-sm text-slate-600">
                  Copy the embed snippet from <span className="font-medium">Settings → Share</span> and paste it into your website. Visitors can fill out your quote form without leaving your site.
                </p>
                <BulletList items={[
                  "Works on any website — Squarespace, Wix, WordPress, custom HTML.",
                  "The widget matches your branding automatically.",
                  "All leads from the widget land in your dashboard the same as the standalone link.",
                ]} />
              </InfoCard>
              <InfoCard>
                <SubHeading>Standalone link vs. widget</SubHeading>
                <p className="text-sm text-slate-600">
                  The standalone link is best for sharing in texts, social bios, and Google Business Profile. The widget is best for your website where you want visitors to stay on your page.
                </p>
                <Tip>If you don&apos;t have a website, the standalone link and QR code cover everything — no widget needed.</Tip>
              </InfoCard>
            </div>
          </section>

          {/* ── REVIEW REQUESTS ── */}
          <section>
            <SectionHeading
              id="review-requests"
              icon={Star}
              title="Review Requests"
              subtitle="Automatically ask homeowners for a Google review when a job is done."
            />
            <div className="space-y-4">
              <InfoCard>
                <SubHeading>How it works</SubHeading>
                <p className="text-sm text-slate-600">
                  When you mark a lead as <span className="font-medium">Completed</span>, Callverted automatically sends the homeowner a warm email asking for a Google review. They click the link and land directly on your Google review page — no extra steps.
                </p>
                <BulletList items={[
                  "One review request per job — it won't send again if you change the status.",
                  "Only sends if the homeowner has an email address on file.",
                  "Only sends if you have a Google Review URL set in Settings.",
                ]} />
              </InfoCard>
              <InfoCard>
                <SubHeading>Setting up your Google Review URL</SubHeading>
                <p className="text-sm text-slate-600">
                  Go to <span className="font-medium">Settings → Google Review URL</span> and paste your Google Business Profile review link. To find it: open your Google Business Profile, click <span className="font-medium">Ask for reviews</span>, and copy the short link.
                </p>
                <Tip>If your Google Review URL isn&apos;t set, review request emails won&apos;t go out — make sure it&apos;s filled in before you start marking jobs Completed.</Tip>
              </InfoCard>
              <InfoCard>
                <SubHeading>Timing</SubHeading>
                <p className="text-sm text-slate-600">
                  The review request fires immediately when you mark the job Completed — while the job is still fresh in the homeowner&apos;s mind. This is intentional: the sooner after a good job, the higher the chance they leave a review.
                </p>
              </InfoCard>
            </div>
          </section>

          {/* ── VISUALIZATION ── */}
          <section>
            <SectionHeading
              id="visualization"
              icon={Palette}
              title="Color Visualization"
              subtitle="Show homeowners a before-and-after preview before the first brush stroke."
            />
            <div className="space-y-4">
              <InfoCard>
                <SubHeading>How it works</SubHeading>
                <p className="text-sm text-slate-600">
                  On any lead detail page, open the <span className="font-medium">Visualizer</span> tab. The homeowner uploads a photo of the room and selects a paint color — Callverted uses AI to apply the color to the walls and generates a side-by-side before-and-after preview.
                </p>
                <BulletList items={[
                  "Works on interior and exterior photos.",
                  "Homeowners can try multiple colors and compare.",
                  "The preview is generated in seconds.",
                  "Helps homeowners commit to a color before you start — fewer change-of-mind situations.",
                ]} />
              </InfoCard>
              <InfoCard>
                <SubHeading>Why it helps close jobs</SubHeading>
                <BulletList items={[
                  "Homeowners who can visualize the result feel more confident moving forward.",
                  "Reduces uncertainty — fewer questions and delays before signing.",
                  "Makes your presentation more professional than a contractor who just shows a paint chip.",
                ]} />
                <Tip>Use the visualizer during your estimate call or walkthrough — it turns a sales conversation into a visual experience.</Tip>
              </InfoCard>
            </div>
          </section>

          {/* ── SETTINGS ── */}
          <section>
            <SectionHeading
              id="settings"
              icon={Settings2}
              title="Settings"
              subtitle="Update your rates, business info, notifications, and more."
            />
            <div className="space-y-4">
              <InfoCard>
                <SubHeading>What you can update</SubHeading>
                <BulletList items={[
                  "Business name and service area.",
                  "Owner name, email, and mobile number.",
                  "Default sqft labor rate and paint tier — affects estimates on all future leads.",
                  "Google Review URL — required for automated review requests.",
                  "Notification preferences — toggle email and SMS notifications on or off.",
                  "Copy your quote link or download your QR code.",
                  "Manage staff members for job assignment.",
                  "Copy the website widget embed snippet.",
                  "Export all your data as a CSV file.",
                ]} />
                <Tip>If you raise your rates, update your sqft rate here so estimates stay accurate.</Tip>
              </InfoCard>
            </div>
          </section>

          {/* ── BILLING ── */}
          <section>
            <SectionHeading
              id="billing"
              icon={CreditCard}
              title="Billing"
              subtitle="Manage your subscription."
            />
            <div className="space-y-4">
              <InfoCard>
                <SubHeading>Plan</SubHeading>
                <p className="text-sm text-slate-600">
                  Callverted is one plan — <span className="font-semibold">$79/month</span> — with everything included: quote form, instant estimates, photo analysis, lead dashboard, quotes, contracts, electronic signatures, scheduling, color visualization, job photos, email + SMS notifications, automated review requests, website widget, QR code, and data export. No add-ons, no upsells.
                </p>
              </InfoCard>
              <InfoCard>
                <SubHeading>Managing your subscription</SubHeading>
                <BulletList items={[
                  "Click Manage Subscription on the Billing page to open the Stripe portal.",
                  "From there you can update your payment method, download invoices, or cancel.",
                  "Cancellation takes effect at the end of your current billing period.",
                  "Your leads and data are preserved if you come back.",
                ]} />
              </InfoCard>
            </div>
          </section>

          {/* Footer */}
          <div className="border-t border-slate-200 pt-8">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 flex items-start gap-3">
              <Star className="h-4 w-4 text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Still have a question?</p>
                <p className="text-sm text-slate-500 mt-0.5">
                  Email us at{" "}
                  <a href="mailto:support@callverted.com" className="text-orange-500 hover:underline">
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
