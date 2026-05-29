import Link from "next/link";
import { RevealOnScroll } from "@/components/marketing/RevealOnScroll";
import "../landing.css";

export const metadata = {
  title: "Features — CraftCapture",
  description: "Everything painting contractors need to capture leads, send quotes, sign contracts, and schedule jobs — in one place.",
};

export default function FeaturesPage() {
  return (
    <div className="landing">

      {/* NAV */}
      <nav className="l-nav">
        <Link href="/" className="l-nav-logo">
          <img src="/icon-mark.svg" alt="CraftCapture" style={{ width: "28px", height: "28px", flexShrink: 0 }} />
          CraftCapture
        </Link>
        <div className="l-nav-links">
          <Link href="/features">Features</Link>
          <Link href="/#pricing">Pricing</Link>
          <Link href="/#faq">FAQ</Link>
        </div>
        <div className="l-nav-right">
          <Link href="/sign-in" className="l-btn-ghost">Log in</Link>
          <Link href="/sign-up" className="l-btn-cta">Start free trial</Link>
        </div>
      </nav>

      {/* PAGE HERO */}
      <div className="l-feat-pg-hero">
        <div className="l-eyebrow">Features</div>
        <h1 className="l-feat-pg-h1">Everything in one place.<br />Nothing you don't need.</h1>
        <p className="l-feat-pg-sub">CraftCapture covers the full job cycle — from the first homeowner inquiry to a signed contract and scheduled start date.</p>
        <div className="l-hero-ctas" style={{ justifyContent: "center" }}>
          <Link href="/sign-up" className="l-btn-hero">Start free 14-day trial</Link>
          <Link href="/" className="l-btn-hero-ghost">See how it works</Link>
        </div>
      </div>

      {/* SETUP STRIP */}
      <div className="l-feat-pg-setup">
        <div className="l-feat-pg-setup-item">
          <span className="l-feat-pg-setup-ico">⚡</span>
          <div>
            <div className="l-feat-pg-setup-title">Live in 10 minutes</div>
            <div className="l-feat-pg-setup-sub">Your quote link is active the moment you finish setup.</div>
          </div>
        </div>
        <div className="l-feat-pg-setup-divider" />
        <div className="l-feat-pg-setup-item">
          <span className="l-feat-pg-setup-ico">🎯</span>
          <div>
            <div className="l-feat-pg-setup-title">We walk you through it</div>
            <div className="l-feat-pg-setup-sub">Free onboarding call included — we set everything up with you.</div>
          </div>
        </div>
        <div className="l-feat-pg-setup-divider" />
        <div className="l-feat-pg-setup-item">
          <span className="l-feat-pg-setup-ico">🔧</span>
          <div>
            <div className="l-feat-pg-setup-title">No IT required</div>
            <div className="l-feat-pg-setup-sub">No integrations, no complicated config. Just sign up and go.</div>
          </div>
        </div>
      </div>

      {/* FEATURE 1 — LEAD CAPTURE */}
      <section className="l-nsec l-nsec--white">
        <div className="l-nsplit">
          <RevealOnScroll className="l-ncopy">
            <div className="l-neyebrow">Lead Capture</div>
            <h2 className="l-ntitle">A quote link that works while you're on the job.</h2>
            <p className="l-ndesc">
              Share a single link — on your truck, yard signs, Instagram bio, or business cards. Homeowners fill out a short form with photos and get an instant ballpark estimate. You get a notification with everything you need before you call back.
            </p>
            <p className="l-ninline">Instant quote preview · Photo upload · QR code · Instant email alert · No app needed for homeowners</p>
          </RevealOnScroll>
          <RevealOnScroll className="l-nvis">
            <div className="l-feat-pg-card">
              <div className="l-feat-pg-card-hd">
                <span className="l-feat-pg-icon">📋</span>
                <span className="l-feat-pg-card-title">New lead via your quote link</span>
              </div>
              <div className="l-feat-pg-row"><span className="l-feat-pg-lbl">Name</span><span className="l-feat-pg-val">Sarah Mitchell</span></div>
              <div className="l-feat-pg-row"><span className="l-feat-pg-lbl">Service</span><span className="l-feat-pg-val">Interior — 3 bedrooms</span></div>
              <div className="l-feat-pg-row"><span className="l-feat-pg-lbl">Estimate</span><span className="l-feat-pg-val l-feat-pg-val--orange">$1,800 – $2,550</span></div>
              <div className="l-feat-pg-row"><span className="l-feat-pg-lbl">Photos</span><span className="l-feat-pg-val">3 uploaded</span></div>
              <div className="l-feat-pg-row"><span className="l-feat-pg-lbl">Timeline</span><span className="l-feat-pg-val">ASAP</span></div>
              <div className="l-feat-pg-toast">
                <span className="l-hdash-toast-dot" />
                New lead · Sarah M. · 2 min ago
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* FEATURE 2 — PIPELINE */}
      <section className="l-nsec l-nsec--offwhite">
        <div className="l-nsplit l-nsplit--rev">
          <RevealOnScroll className="l-ncopy">
            <div className="l-neyebrow">Pipeline</div>
            <h2 className="l-ntitle">Every lead in one place. Nothing falls through.</h2>
            <p className="l-ndesc">
              See all your leads at a glance — new, contacted, quoted, scheduled, won. Switch between a list view and a kanban pipeline. Stale leads get flagged automatically so nothing goes cold without you noticing.
            </p>
            <p className="l-ninline">List + kanban view · Stale lead alerts · Status tracking · Search + filter</p>
          </RevealOnScroll>
          <RevealOnScroll className="l-nvis">
            <div className="l-feat-pg-pipe">
              {[
                { label: "New", count: 3, color: "#3B82F6" },
                { label: "Contacted", count: 2, color: "#F59E0B" },
                { label: "Quoted", count: 4, color: "#8B5CF6" },
                { label: "Scheduled", count: 2, color: "#6366F1" },
                { label: "Won", count: 7, color: "#10B981" },
              ].map((col) => (
                <div key={col.label} className="l-feat-pg-pipe-col">
                  <div className="l-feat-pg-pipe-hd" style={{ color: col.color }}>
                    {col.label} <span className="l-feat-pg-pipe-count">{col.count}</span>
                  </div>
                  {Array.from({ length: Math.min(col.count, 2) }).map((_, i) => (
                    <div key={i} className="l-feat-pg-pipe-card" />
                  ))}
                </div>
              ))}
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* FEATURE 3 — QUOTES */}
      <section className="l-nsec l-nsec--white">
        <div className="l-nsplit">
          <RevealOnScroll className="l-ncopy">
            <div className="l-neyebrow">Quotes</div>
            <h2 className="l-ntitle">Professional quotes sent in minutes, not days.</h2>
            <p className="l-ndesc">
              Build a quote with line items, set your margins, add a personal message, and send a PDF link the homeowner can view and accept on their phone. You get notified the moment they accept.
            </p>
            <p className="l-ninline">PDF quotes · Line items · Homeowner accept/decline · Expiry dates · Nudge reminders</p>
          </RevealOnScroll>
          <RevealOnScroll className="l-nvis">
            <div className="l-feat-pg-card">
              <div className="l-feat-pg-card-hd">
                <span className="l-feat-pg-icon">📄</span>
                <span className="l-feat-pg-card-title">Quote CC-0012</span>
                <span className="l-feat-pg-badge l-feat-pg-badge--green">Accepted</span>
              </div>
              <div className="l-feat-pg-row"><span className="l-feat-pg-lbl">Client</span><span className="l-feat-pg-val">James Rodriguez</span></div>
              <div className="l-feat-pg-row"><span className="l-feat-pg-lbl">Scope</span><span className="l-feat-pg-val">Exterior — full repaint</span></div>
              <div className="l-feat-pg-row l-feat-pg-row--line"><span className="l-feat-pg-lbl">Labor</span><span className="l-feat-pg-val">$3,780</span></div>
              <div className="l-feat-pg-row l-feat-pg-row--line"><span className="l-feat-pg-lbl">Materials</span><span className="l-feat-pg-val">$1,620</span></div>
              <div className="l-feat-pg-row l-feat-pg-row--total"><span className="l-feat-pg-lbl">Total</span><span className="l-feat-pg-val l-feat-pg-val--orange">$5,400</span></div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* FEATURE 4 — CONTRACTS */}
      <section className="l-nsec l-nsec--offwhite">
        <div className="l-nsplit l-nsplit--rev">
          <RevealOnScroll className="l-ncopy">
            <div className="l-neyebrow">Contracts</div>
            <h2 className="l-ntitle">Send a contract from your truck. Get it signed before you get home.</h2>
            <p className="l-ndesc">
              Turn an accepted quote into a contract in one click. The homeowner signs on their phone — no printing, no scanning, no chasing. Signed contracts are stored permanently and available any time.
            </p>
            <p className="l-ninline">Digital signatures · Auto-generated from quote · Permanent storage · Signed timestamp + IP</p>
          </RevealOnScroll>
          <RevealOnScroll className="l-nvis">
            <div className="l-feat-pg-card">
              <div className="l-feat-pg-card-hd">
                <span className="l-feat-pg-icon">✍️</span>
                <span className="l-feat-pg-card-title">Contract signed</span>
                <span className="l-feat-pg-badge l-feat-pg-badge--green">Signed</span>
              </div>
              <div className="l-feat-pg-row"><span className="l-feat-pg-lbl">Client</span><span className="l-feat-pg-val">Linda Kim</span></div>
              <div className="l-feat-pg-row"><span className="l-feat-pg-lbl">Signed</span><span className="l-feat-pg-val">Today, 3:42 PM</span></div>
              <div className="l-feat-pg-row"><span className="l-feat-pg-lbl">Job value</span><span className="l-feat-pg-val l-feat-pg-val--orange">$7,800</span></div>
              <div className="l-feat-pg-sig">
                <div className="l-feat-pg-sig-line" />
                <span className="l-feat-pg-sig-lbl">Linda Kim — digitally signed</span>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* FEATURE 5 — SCHEDULING */}
      <section className="l-nsec l-nsec--white">
        <div className="l-nsplit">
          <RevealOnScroll className="l-ncopy">
            <div className="l-neyebrow">Scheduling</div>
            <h2 className="l-ntitle">Schedule the job and notify everyone in one step.</h2>
            <p className="l-ndesc">
              Set the date, assign crew, and send a confirmation email to the homeowner — all from the same screen. Export your schedule as a .ics file to sync with Google Calendar or Apple Calendar.
            </p>
            <p className="l-ninline">Crew assignment · Homeowner confirmation · Calendar export · Multi-day jobs · Review request</p>
          </RevealOnScroll>
          <RevealOnScroll className="l-nvis">
            <div className="l-feat-pg-card">
              <div className="l-feat-pg-card-hd">
                <span className="l-feat-pg-icon">📅</span>
                <span className="l-feat-pg-card-title">Schedule — this week</span>
              </div>
              {[
                { day: "Mon Apr 14", name: "Sarah M.", type: "Interior", crew: "2 crew" },
                { day: "Wed Apr 16", name: "James R.", type: "Exterior", crew: "3 crew" },
                { day: "Fri Apr 18", name: "Linda K.", type: "Int + Ext", crew: "4 crew" },
              ].map((job) => (
                <div key={job.day} className="l-feat-pg-sched-row">
                  <span className="l-feat-pg-sched-day">{job.day}</span>
                  <span className="l-feat-pg-sched-name">{job.name}</span>
                  <span className="l-feat-pg-sched-type">{job.type}</span>
                  <span className="l-feat-pg-sched-crew">{job.crew}</span>
                </div>
              ))}
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* FEATURE 6 — VISUALIZATION */}
      <section className="l-nsec l-nsec--offwhite">
        <div className="l-nsplit l-nsplit--rev">
          <RevealOnScroll className="l-ncopy">
            <div className="l-neyebrow">Visualization</div>
            <h2 className="l-ntitle">Help homeowners picture the finished job.</h2>
            <p className="l-ndesc">
              Homeowners upload a photo of their room and pick a color. AI applies the color to the walls and shows a before-and-after preview — before the first brush stroke. Reduces uncertainty, builds trust, helps you close.
            </p>
            <p className="l-ninline">Clearer expectations · More confidence · More professional presentation</p>
          </RevealOnScroll>
          <RevealOnScroll className="l-nvis">
            <div className="l-mock-viz">
              <div className="l-mock-viz-row">
                <div className="l-mock-viz-panel">
                  <div className="l-mock-viz-lbl">Before</div>
                  <img src="/visualizer-before.jpg" alt="Room before painting" className="l-mock-viz-img" />
                </div>
                <div className="l-mock-viz-panel">
                  <div className="l-mock-viz-lbl">After</div>
                  <img src="/visualizer-after.jpg" alt="Room after painting" className="l-mock-viz-img" />
                </div>
              </div>
              <div className="l-mock-viz-foot">
                <span className="l-mock-viz-color" style={{ background: "#A8C5A0" }} />
                <span className="l-mock-viz-color" style={{ background: "#8FB587" }} />
                <span className="l-mock-viz-color" style={{ background: "#739E6A" }} />
                <span className="l-mock-viz-foot-lbl">Sherwin-Williams Retreat</span>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="l-fcta">
        <RevealOnScroll>
          <div className="l-fcta-inner">
            <h2 className="l-fcta-h2">Ready to run a tighter operation?</h2>
            <p className="l-fcta-sub">Start your free 14-day trial. No credit card required.</p>
            <Link href="/sign-up" className="l-btn-hero">Start free trial →</Link>
            <p className="l-fcta-note">$79/month · No long-term contract · Cancel anytime</p>
          </div>
        </RevealOnScroll>
      </section>

    </div>
  );
}
