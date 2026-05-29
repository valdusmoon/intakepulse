import Link from "next/link";
import Script from "next/script";
import { QuoteWidget } from "@/components/marketing/QuoteWidget";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { RevealOnScroll } from "@/components/marketing/RevealOnScroll";
import { CalendlyButton } from "@/components/marketing/CalendlyButton";
import "./landing.css";

export default function Home() {
  return (
    <div className="landing">
      <link rel="stylesheet" href="https://assets.calendly.com/assets/external/widget.css" />
      <Script src="https://assets.calendly.com/assets/external/widget.js" strategy="lazyOnload" />

      {/* NAV */}
      <nav className="l-nav">
        <Link href="/" className="l-nav-logo">
          <img src="/icon-mark.svg" alt="CraftCapture" style={{ width: "28px", height: "28px", flexShrink: 0 }} />
          CraftCapture
        </Link>
        <div className="l-nav-links">
          <Link href="/features">Features</Link>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </div>
        <div className="l-nav-right">
          <Link href="/sign-in" className="l-btn-ghost">Log in</Link>
          <Link href="/sign-up" className="l-btn-cta">Start free trial</Link>
        </div>
      </nav>

      {/* HERO */}
      <div className="l-hero-wrap">
        <div>
          <div className="l-hero-badge">🎨 Built for painting contractors</div>
          <h1 className="l-h1">From first inquiry<br />to <span>booked job.</span></h1>
          <p className="l-hero-desc">
            CraftCapture gives painting contractors one simple system for leads, quotes, contracts, and scheduling — without the chasing, scattered follow-ups, or dropped jobs.
          </p>
          <div className="l-hero-ctas">
            <Link href="/sign-up" className="l-btn-hero">Start free 14-day trial</Link>
            <CalendlyButton className="l-btn-hero-ghost">Book a demo</CalendlyButton>
          </div>
          <div className="l-hero-trust">
            <span className="l-trust-dot" />
            Free 14-day trial &nbsp;·&nbsp; Setup in 10 minutes &nbsp;·&nbsp; $79/month after trial
          </div>
          <div className="l-hero-onboard">Free onboarding call included if you want help getting set up.</div>
        </div>

        <div className="l-hero-photo">
          <img
            src="/images/hero-painter.webp"
            alt="Painting contractor on the job site"
            className="l-hero-photo-img"
          />
        </div>
      </div>

      {/* STATS */}
      <div className="l-stats l-stats--3">
        <RevealOnScroll className="l-stat">
          <div className="l-stat-n"><em>Better lead quality</em></div>
          <div className="l-stat-l">Project details and photos before the callback</div>
        </RevealOnScroll>
        <RevealOnScroll className="l-stat">
          <div className="l-stat-n"><em>One organized workflow</em></div>
          <div className="l-stat-l">Quotes, contracts, and scheduling in one place</div>
        </RevealOnScroll>
        <RevealOnScroll className="l-stat">
          <div className="l-stat-n"><em>More booked jobs</em></div>
          <div className="l-stat-l">A smoother process from inquiry to signed contract</div>
        </RevealOnScroll>
      </div>

      {/* PROBLEM */}
      <section className="l-problem-sec" id="problem">
        <div className="l-section-wrap">
          <div className="l-eyebrow">The problem</div>
          <h2 className="l-sh2">Your quoting process is losing you jobs.</h2>
          <p className="l-ssub">It&apos;s not your craft. It&apos;s the back-and-forth between the first call and the first brush stroke.</p>
          <div className="l-pgrid">
            <RevealOnScroll>
              <div className="l-prob-card">
                <div className="l-prob-card-ico">📋</div>
                <h4>Missing details before the visit</h4>
                <p>You show up blind — no photos, no timeline, no clear scope.</p>
              </div>
            </RevealOnScroll>
            <RevealOnScroll>
              <div className="l-prob-card">
                <div className="l-prob-card-ico">⏱️</div>
                <h4>Too much chasing</h4>
                <p>Too many texts and calls just to collect the basics.</p>
              </div>
            </RevealOnScroll>
            <RevealOnScroll>
              <div className="l-prob-card">
                <div className="l-prob-card-ico">📞</div>
                <h4>Every quote starts from zero</h4>
                <p>No intake system means every job starts as a scramble.</p>
              </div>
            </RevealOnScroll>
            <RevealOnScroll>
              <div className="l-prob-card">
                <div className="l-prob-card-ico">💸</div>
                <h4>Leads slip through the cracks</h4>
                <p>Texts, voicemails, and DMs turn into missed follow-ups.</p>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* SECTION 1 — LEAD CAPTURE */}
      <section className="l-nsec l-nsec--gray" id="how-it-works">
        <div className="l-nsplit">
          <RevealOnScroll className="l-ncopy">
            <div className="l-neyebrow">Lead Capture</div>
            <h2 className="l-ntitle">Every quote starts with the right information.</h2>
            <p className="l-ndesc">
              Send your quote link to anyone who asks for a price. Homeowners add photos, project details, and timeline before you ever call back.
            </p>
            <p className="l-ninline">Photos upfront · Ballpark estimate · Less back-and-forth</p>
          </RevealOnScroll>
          <RevealOnScroll className="l-nvis">
            <QuoteWidget />
          </RevealOnScroll>
        </div>
      </section>

      {/* SECTION 2 — PIPELINE */}
      <section className="l-nsec l-nsec--white">
        <div className="l-nsplit l-nsplit--rev">
          <RevealOnScroll className="l-ncopy">
            <div className="l-neyebrow">Pipeline</div>
            <h2 className="l-ntitle">Your full pipeline at a glance.</h2>
            <p className="l-ndesc">
              See every lead, what needs attention, and what&apos;s next — in one organized place.
            </p>
            <p className="l-ninline">List + board view · Needs-attention alerts · One place for follow-up</p>
          </RevealOnScroll>
          <RevealOnScroll className="l-nvis">
            <div className="l-mock-pipe-wrap">
              <div className="l-mock-pipe-hd">
                <span className="l-mock-pipe-hd-title">Leads</span>
                <span className="l-mock-pipe-tab l-mock-pipe-tab--active">List</span>
                <span className="l-mock-pipe-tab">Board</span>
              </div>
              <div className="l-mock-pipe-row">
                <div className="l-mock-pipe-av l-mock-pipe-av--orange">SM</div>
                <div className="l-mock-pipe-info">
                  <div className="l-mock-pipe-name">Sarah M. <span className="l-mock-badge-new" style={{marginLeft:"4px"}}>NEW</span></div>
                  <div className="l-mock-pipe-meta">Interior · 2 min ago</div>
                </div>
                <div className="l-mock-pipe-right">
                  <div className="l-mock-pipe-est">$1,800–$2,550</div>
                  <div style={{marginTop:"3px"}}><span className="l-hbadge l-hb-new">New</span></div>
                </div>
              </div>
              <div className="l-mock-pipe-row">
                <div className="l-mock-pipe-av l-mock-pipe-av--blue">JR</div>
                <div className="l-mock-pipe-info">
                  <div className="l-mock-pipe-name">James R.</div>
                  <div className="l-mock-pipe-meta">Exterior · 1 hr ago</div>
                </div>
                <div className="l-mock-pipe-right">
                  <div className="l-mock-pipe-est">$4,200–$6,100</div>
                  <div style={{marginTop:"3px"}}><span className="l-hbadge l-hb-quoted">Quoted</span></div>
                </div>
              </div>
              <div className="l-mock-pipe-row">
                <div className="l-mock-pipe-av l-mock-pipe-av--purple">MD</div>
                <div className="l-mock-pipe-info">
                  <div className="l-mock-pipe-name">Marcus D.</div>
                  <div className="l-mock-pipe-meta">Exterior · Yesterday</div>
                </div>
                <div className="l-mock-pipe-right">
                  <div className="l-mock-pipe-est">$3,100–$4,400</div>
                  <div style={{marginTop:"3px"}}><span className="l-hbadge l-hb-sched">Scheduled</span></div>
                </div>
              </div>
              <div className="l-mock-pipe-row">
                <div className="l-mock-pipe-av l-mock-pipe-av--green">LK</div>
                <div className="l-mock-pipe-info">
                  <div className="l-mock-pipe-name">Linda K.</div>
                  <div className="l-mock-pipe-meta">Interior + Exterior · 2 days ago</div>
                </div>
                <div className="l-mock-pipe-right">
                  <div className="l-mock-pipe-est">$6,500–$9,200</div>
                  <div style={{marginTop:"3px"}}><span className="l-hbadge l-hb-won">Won</span></div>
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* SECTION 3 — QUOTES + CONTRACTS */}
      <section className="l-nsec l-nsec--gray">
        <div className="l-nsplit">
          <RevealOnScroll className="l-ncopy">
            <div className="l-neyebrow">Quotes &amp; Contracts</div>
            <h2 className="l-ntitle">Send the quote. Get the signature. Keep the job moving.</h2>
            <p className="l-ndesc">
              Build professional quotes, send them fast, and collect signatures from anywhere — all from the same lead.
            </p>
            <p className="l-ninline">PDF quotes · E-signature · Sign notifications</p>
          </RevealOnScroll>
          <RevealOnScroll className="l-nvis">
            <div className="l-qc-editorial">
              <img
                src="/images/contracts-painter.webp"
                alt="Painting contractor sending a quote from his truck"
                className="l-ph-contract"
                style={{ objectFit: "cover", objectPosition: "center 30%", display: "block" }}
              />
              <div className="l-mock-qb">
                <div className="l-mock-qb-hd">
                  <span className="l-mock-qb-title">Quote — Sarah M.</span>
                  <span className="l-mock-qb-send">Send Quote →</span>
                </div>
                <div className="l-mock-qb-row l-mock-qb-head">
                  <span>Line item</span><span>Amount</span>
                </div>
                <div className="l-mock-qb-row">
                  <span>Living Room</span><span>$840</span>
                </div>
                <div className="l-mock-qb-row">
                  <span>Master Bedroom</span><span>$620</span>
                </div>
                <div className="l-mock-qb-row">
                  <span>Hallway</span><span>$310</span>
                </div>
                <div className="l-mock-qb-row l-mock-qb-total">
                  <span>Total</span><span>$1,770</span>
                </div>
              </div>
              <div className="l-mock-sign-strip">
                <div className="l-mock-sign-check">✓</div>
                <div className="l-mock-sign-info">
                  <div className="l-mock-sign-title">Contract Signed by Sarah M.</div>
                  <div className="l-mock-sign-sub">April 12, 2026 · 2:34 PM</div>
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* SECTION 4 — SCHEDULING */}
      <section className="l-nsec l-nsec--white">
        <div className="l-nsplit l-nsplit--rev">
          <RevealOnScroll className="l-ncopy">
            <div className="l-neyebrow">Scheduling</div>
            <h2 className="l-ntitle">Schedule jobs without the back-and-forth.</h2>
            <p className="l-ndesc">
              Assign crew, set the date, and notify everyone from one place.
            </p>
            <p className="l-ninline">Calendar view · Crew assignment · Automatic notifications</p>
          </RevealOnScroll>
          <RevealOnScroll className="l-nvis">
            <div className="l-mock-sched">
              <div className="l-mock-sched-hd">
                <span className="l-mock-sched-title">Schedule — April 2026</span>
                <span className="l-mock-sched-nav">← April →</span>
              </div>
              <div className="l-mock-sched-days">
                {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
                  <div key={d} className="l-mock-sched-day-lbl">{d}</div>
                ))}
                {[6,7,8,9,10,11,12].map((n) => (
                  <div key={n} className={`l-mock-sched-day${n===12?" l-mock-sched-day--today":""}${[7,10,12].includes(n)?" l-mock-sched-day--dot":""}`}>{n}</div>
                ))}
                {[13,14,15,16,17,18,19].map(n => (
                  <div key={n} className={`l-mock-sched-day${[14,16].includes(n)?" l-mock-sched-day--dot":""}`}>{n}</div>
                ))}
              </div>
              <div className="l-mock-sched-jobs">
                <div className="l-mock-sched-job l-mock-sched-job--orange">
                  <span className="l-mock-sched-time">8:00 AM</span>
                  <div>
                    <div className="l-mock-sched-name">Sarah M. — Interior</div>
                    <div className="l-mock-sched-detail">3 rooms · 142 Oak St</div>
                  </div>
                  <span className="l-mock-sched-crew">2 crew</span>
                </div>
                <div className="l-mock-sched-job l-mock-sched-job--blue">
                  <span className="l-mock-sched-time">1:00 PM</span>
                  <div>
                    <div className="l-mock-sched-name">Marcus D. — Exterior</div>
                    <div className="l-mock-sched-detail">Full exterior · 88 Maple Ave</div>
                  </div>
                  <span className="l-mock-sched-crew">3 crew</span>
                </div>
                <div className="l-mock-sched-job l-mock-sched-job--green">
                  <span className="l-mock-sched-time">Apr 14</span>
                  <div>
                    <div className="l-mock-sched-name">Linda K. — Int + Ext</div>
                    <div className="l-mock-sched-detail">Full project · 9 River Rd</div>
                  </div>
                  <span className="l-mock-sched-crew">4 crew</span>
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* SECTION 5 — VISUALIZATION */}
      <section className="l-nsec l-nsec--offwhite">
        <div className="l-nsplit">
          <RevealOnScroll className="l-ncopy">
            <div className="l-neyebrow">Visualization</div>
            <h2 className="l-ntitle">Help homeowners picture the finished job.</h2>
            <p className="l-ndesc">
              Show before-and-after projections so customers can feel more confident moving forward — before the first brush stroke.
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
                  <img src="/visualizer-after.jpg" alt="Room after painting — sage green walls" className="l-mock-viz-img" />
                </div>
              </div>
              <div className="l-mock-viz-foot">
                <span className="l-mock-viz-color" style={{ background: "#A8C5A0" }} />
                <span className="l-mock-viz-color" style={{ background: "#8FB587" }} />
                <span className="l-mock-viz-color" style={{ background: "#739E6A" }} />
                <span className="l-mock-viz-color" style={{ background: "#5A8552" }} />
                <span className="l-mock-viz-foot-lbl">Sherwin-Williams Retreat</span>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="l-proof-sec">
        <div className="l-section-wrap" style={{ textAlign: "center" }}>
          <div className="l-eyebrow" style={{ color: "var(--orange-mid)" }}>What contractors say</div>
          <h2 className="l-sh2" style={{ color: "white", margin: "0 auto 12px", textAlign: "center", maxWidth: "100%" }}>
            Real results from real painting businesses.
          </h2>
          <p className="l-ssub" style={{ color: "#94A3B8", margin: "0 auto 44px", textAlign: "center" }}>
            No fluff. Just what changed after they started using CraftCapture.
          </p>
        </div>
        <div className="l-proof-grid">
          <div className="l-proof-card">
            <div className="l-proof-stars">★★★★★</div>
            <p className="l-proof-quote">&ldquo;Signed up on a Monday, had my first lead the same afternoon. The homeowner already knew the estimate when I called back.&rdquo;</p>
            <div className="l-proof-auth">
              <img src="/images/testimonial-marcus.webp" alt="Marcus T." className="l-proof-ph" style={{ objectFit: "cover" }} />
              <div>
                <div className="l-proof-name">Marcus T.</div>
                <div className="l-proof-role">Dallas Painters Pro</div>
              </div>
            </div>
          </div>
          <div className="l-proof-card">
            <div className="l-proof-stars">★★★★★</div>
            <p className="l-proof-quote">&ldquo;Spent an hour on every site visit collecting details I should&apos;ve had before showing up. Now they send it through the form. Different world.&rdquo;</p>
            <div className="l-proof-auth">
              <img src="/images/testimonial-kevin.webp" alt="Kevin L." className="l-proof-ph" style={{ objectFit: "cover" }} />
              <div>
                <div className="l-proof-name">Kevin L.</div>
                <div className="l-proof-role">Pacific Coast Painting</div>
              </div>
            </div>
          </div>
          <div className="l-proof-card">
            <div className="l-proof-stars">★★★★★</div>
            <p className="l-proof-quote">&ldquo;Sent the contract from my truck. Homeowner signed it before I got home. That&apos;s the kind of thing you tell other painters about.&rdquo;</p>
            <div className="l-proof-auth">
              <img src="/images/testimonial-ray.webp" alt="Ray M." className="l-proof-ph" style={{ objectFit: "cover" }} />
              <div>
                <div className="l-proof-name">Ray M.</div>
                <div className="l-proof-role">Sunstate Painting Co.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="l-pricing-sec" id="pricing">
        <div className="l-section-wrap" style={{ textAlign: "center" }}>
          <div className="l-eyebrow">Pricing</div>
          <h2 className="l-sh2" style={{ maxWidth: "100%", textAlign: "center" }}>Simple pricing. Serious returns.</h2>
          <p className="l-ssub" style={{ margin: "10px auto 0", textAlign: "center", maxWidth: "420px" }}>
            One extra booked job pays for years of CraftCapture.
          </p>
        </div>
        <RevealOnScroll>
          <div className="l-price-card">
            <div className="l-pbadge">✦ Everything Included</div>
            <div className="l-pprice">$79<sub>/month</sub></div>
            <p className="l-psub">All features. Unlimited leads. Cancel anytime.</p>
            <ul className="l-pfeats l-pfeats--grid">
              <li>Shareable lead form + QR code</li>
              <li>AI instant estimates</li>
              <li>Lead pipeline — board &amp; list</li>
              <li>Itemized quotes with PDF</li>
              <li>Electronic contracts (e-sign)</li>
              <li>Scheduling + crew assignment</li>
              <li>Job photo uploads</li>
              <li>Email + SMS notifications</li>
              <li>Google review automation</li>
              <li>Unlimited leads, no caps</li>
              <li>Free onboarding call included</li>
            </ul>
            <Link href="/sign-up" className="l-btnp">Start Free 14-Day Trial →</Link>
            <p className="l-pnote">Free for 14 days. Cancel anytime before billing.</p>
            <div className="l-proi">
              <p>📊 At $2,800 avg job value, booking <span>just 1 extra job</span> pays for 35 months of CraftCapture.</p>
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* FAQ */}
      <section className="l-faq-sec" id="faq">
        <div className="l-eyebrow">FAQ</div>
        <h2 className="l-sh2">Straight answers</h2>
        <FaqAccordion />
      </section>

      {/* FINAL CTA */}
      <section className="l-fcta">
        <h2>A better quoting process starts today.</h2>
        <p>Set up in 10 minutes. Every lead organized from the first message.</p>
        <div className="l-fcta-ctas">
          <Link href="/sign-up" className="l-btnf">Start Free 14-Day Trial →</Link>
          <CalendlyButton className="l-btnfg">Book a demo</CalendlyButton>
        </div>
        <p style={{ color: "#475569", fontSize: ".8rem", marginTop: "18px", position: "relative" }}>
          $79/month · No long-term contract · Cancel anytime
        </p>
      </section>

      {/* FOOTER */}
      <footer className="l-footer">
        <div className="l-flogo">
          <img src="/icon-mark.svg" alt="CraftCapture" style={{ width: "22px", height: "22px" }} />
          CraftCapture
        </div>
        <p>© 2026 CraftCapture · Built for painting contractors</p>
        <div className="l-flinks">
          <Link href="/legal/privacy">Privacy</Link>
          <Link href="/legal/terms">Terms</Link>
          <a href="mailto:hello@craftcapture.com">Contact</a>
        </div>
      </footer>
    </div>
  );
}
