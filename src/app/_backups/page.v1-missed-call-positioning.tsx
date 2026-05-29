import Link from "next/link";
import { QuoteWidget } from "@/components/marketing/QuoteWidget";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { FeatureSection } from "@/components/marketing/FeatureSection";
import { RevealOnScroll } from "@/components/marketing/RevealOnScroll";
import "./landing.css";

export default function Home() {
  return (
    <div className="landing">
      {/* NAV */}
      <nav className="l-nav">
        <Link href="/" className="l-nav-logo">
          <img src="/icon-mark.svg" alt="CraftCapture" style={{ width: "28px", height: "28px", flexShrink: 0 }} />
          CraftCapture
        </Link>
        <div className="l-nav-links">
          <a href="#how-it-works">How it works</a>
          <a href="#features">Features</a>
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
          <h1 className="l-h1">Homeowners get an instant quote<br />while <span>you&apos;re on the job</span></h1>
          <p className="l-hero-desc">
            Text your quote link in seconds. They answer 4 quick questions, get a ballpark estimate instantly,
            and submit their info — no waiting, no back-and-forth, no time off the ladder.
          </p>
          <div className="l-hero-ctas">
            <Link href="/sign-up" className="l-btn-hero">Start free 14-day trial</Link>
            <a href="#how-it-works" className="l-btn-hero-ghost">See how it works</a>
          </div>
          <div className="l-hero-trust">
            <span className="l-trust-dot" />
            No credit card tricks &nbsp;·&nbsp; Setup in 10 minutes &nbsp;·&nbsp; $79/month after trial
          </div>
        </div>

        <QuoteWidget />
      </div>

      {/* LOGOS */}
      <div className="l-logos-bar">
        <div className="l-logos-lbl">Painters using CraftCapture across the US</div>
        <div className="l-logos-row">
          {["Dallas, TX", "Phoenix, AZ", "Miami, FL", "Houston, TX", "Atlanta, GA", "Denver, CO"].map((city) => (
            <div key={city} className="l-logo-pill">{city}</div>
          ))}
        </div>
      </div>

      {/* STATS */}
      <div className="l-stats">
        <RevealOnScroll className="l-stat">
          <div className="l-stat-n"><em>3–5</em></div>
          <div className="l-stat-l">Leads lost per week on average while on the job</div>
        </RevealOnScroll>
        <RevealOnScroll className="l-stat">
          <div className="l-stat-n">$<em>2,800</em></div>
          <div className="l-stat-l">Average painting job value in the US</div>
        </RevealOnScroll>
        <RevealOnScroll className="l-stat">
          <div className="l-stat-n"><em>10</em>s</div>
          <div className="l-stat-l">Time to text your quote link to any new inquiry</div>
        </RevealOnScroll>
        <RevealOnScroll className="l-stat">
          <div className="l-stat-n"><em>24/7</em></div>
          <div className="l-stat-l">Your quote form works even while you paint</div>
        </RevealOnScroll>
      </div>

      {/* PROBLEM */}
      <section className="l-problem-sec" id="problem">
        <div className="l-section-wrap">
          <div className="l-eyebrow">The problem</div>
          <h2 className="l-sh2">You&apos;re losing jobs while you&apos;re working.</h2>
          <p className="l-ssub">It&apos;s not your craft. It&apos;s what happens between the phone ring and the first brush stroke.</p>
          <div className="l-pgrid">
            <RevealOnScroll>
              <div className="l-prob-card">
                <div className="l-prob-card-ico">📵</div>
                <h4>Missed calls = missed jobs</h4>
                <p>You can&apos;t answer while painting. By the time you call back, the homeowner already booked someone else. The first contractor to respond almost always wins the job.</p>
              </div>
            </RevealOnScroll>
            <RevealOnScroll>
              <div className="l-prob-card">
                <div className="l-prob-card-ico">⏱️</div>
                <h4>Estimates take hours to send</h4>
                <p>Drive out, measure, go home, build the quote, email it. Hours later. Meanwhile the homeowner has 3 other quotes in their inbox and yours arrives last.</p>
              </div>
            </RevealOnScroll>
            <RevealOnScroll>
              <div className="l-prob-card">
                <div className="l-prob-card-ico">⚡</div>
                <h4>First to respond almost always wins</h4>
                <p>When a homeowner reaches out, they&apos;re messaging 2–3 painters at once. The first one to give them a number wins. If you can&apos;t respond for hours, you&apos;ve already lost.</p>
              </div>
            </RevealOnScroll>
            <RevealOnScroll>
              <div className="l-prob-card">
                <div className="l-prob-card-ico">💸</div>
                <h4>Hidden revenue you&apos;ll never see</h4>
                <p>Missing 4 leads a week at $2,800 average is over half a million in annual revenue walking away. You&apos;ll never know because you never knew they called.</p>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="l-hiw" id="how-it-works">
        <div className="l-section-wrap">
          <div className="l-eyebrow">How it works</div>
          <h2 className="l-sh2">Set up in 10 minutes. Works while you paint.</h2>
          <p className="l-ssub">Three steps. No tech experience required. Nothing complicated.</p>
          <div className="l-steps">
            <RevealOnScroll>
              <div className="l-scard">
                <div className="l-snum">01</div>
                <div className="l-sico">🔗</div>
                <h4>Share your link or QR code</h4>
                <p>You get a unique quote link and downloadable QR code the moment you sign up. Put it on your truck, business cards, yard signs, or text it to anyone who calls. 30 seconds to set up.</p>
              </div>
            </RevealOnScroll>
            <RevealOnScroll>
              <div className="l-scard">
                <div className="l-snum">02</div>
                <div className="l-sico">🤖</div>
                <h4>They get a ballpark estimate in under 60 seconds</h4>
                <p>A simple tap form asks about rooms, home size, and timeline. No typing required. They get an instant ballpark number — and you get their contact info the moment they submit.</p>
              </div>
            </RevealOnScroll>
            <RevealOnScroll>
              <div className="l-scard">
                <div className="l-snum">03</div>
                <div className="l-sico">📲</div>
                <h4>You get the lead instantly</h4>
                <p>You get an email with their name, number, photos, and project details the moment they submit. Call them back with everything you need to close — before they&apos;ve heard back from anyone else.</p>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="l-feat-sec" id="features">
        <div className="l-section-wrap">
          <div className="l-eyebrow">Features</div>
          <h2 className="l-sh2">Everything you need. Nothing you won&apos;t use.</h2>
          <p className="l-ssub">Built specifically for painting contractors — not a bloated generic platform.</p>
          <FeatureSection />
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="l-testi" id="testimonials">
        <div className="l-section-wrap">
          <div className="l-eyebrow">Real results</div>
          <h2 className="l-sh2">Painters who stopped losing jobs they never knew about</h2>
          <div className="l-tgrid">
            <RevealOnScroll>
              <div className="l-tcard">
                <div className="l-tstars">★★★★★</div>
                <p className="l-tq">
                  &ldquo;Got a lead while I was mid-spray on an exterior job. Homeowner uploaded photos, got the estimate,
                  and by the time I called back that evening <strong>she was already sold</strong>. Booked a $4,200 job.&rdquo;
                </p>
                <div className="l-tauth">
                  <div className="l-tav">MR</div>
                  <div>
                    <div className="l-tname">Mike R.</div>
                    <div className="l-trole">Solo painter · Dallas, TX</div>
                  </div>
                </div>
              </div>
            </RevealOnScroll>
            <RevealOnScroll>
              <div className="l-tcard">
                <div className="l-tstars">★★★★★</div>
                <p className="l-tq">
                  &ldquo;I used to lose leads just because I was busy on a job. Now they get an estimate instantly and I call
                  back with all their info already in front of me. <strong>My close rate has nearly doubled.</strong>&rdquo;
                </p>
                <div className="l-tauth">
                  <div className="l-tav">TJ</div>
                  <div>
                    <div className="l-tname">Tony J.</div>
                    <div className="l-trole">2-man crew · Phoenix, AZ</div>
                  </div>
                </div>
              </div>
            </RevealOnScroll>
            <RevealOnScroll>
              <div className="l-tcard">
                <div className="l-tstars">★★★★★</div>
                <p className="l-tq">
                  &ldquo;Customers show up to my estimate visit already knowing the ballpark.{" "}
                  <strong>No sticker shock, faster close.</strong> My close rate went from 30% to nearly 50% in the first month.&rdquo;
                </p>
                <div className="l-tauth">
                  <div className="l-tav">CW</div>
                  <div>
                    <div className="l-tname">Carlos W.</div>
                    <div className="l-trole">Owner operator · Miami, FL</div>
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="l-pricing-sec" id="pricing">
        <div className="l-section-wrap" style={{ textAlign: "center" }}>
          <div className="l-eyebrow">Pricing</div>
          <h2 className="l-sh2" style={{ maxWidth: "100%", textAlign: "center" }}>Simple pricing. Serious returns.</h2>
          <p className="l-ssub" style={{ margin: "10px auto 0", textAlign: "center", maxWidth: "420px" }}>
            One extra booked job pays for over 3 years of CraftCapture.
          </p>
        </div>
        <RevealOnScroll>
          <div className="l-price-card">
            <div className="l-pbadge">✦ Everything Included</div>
            <div className="l-pprice"><sup>$</sup>79<sub>/month</sub></div>
            <p className="l-psub">All features. Unlimited leads. Cancel anytime.</p>
            <ul className="l-pfeats">
              <li>Shareable quote link + QR code download</li>
              <li>Homeowner photo upload form (mobile-first)</li>
              <li>Instant estimates from a 4-question tap form</li>
              <li>Instant email alerts on every new lead</li>
              <li>Lead dashboard with full status pipeline</li>
              <li>Manual lead entry with optional AI photo notes</li>
              <li>Unlimited leads — no caps or overages</li>
            </ul>
            <Link href="/sign-up" className="l-btnp">Start Free 14-Day Trial →</Link>
            <p className="l-pnote">No credit card tricks. Cancel before day 14 — you pay nothing.</p>
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
        <h2>Stop losing jobs you never knew you had.</h2>
        <p>Set up takes 10 minutes. Start capturing leads tonight.</p>
        <div className="l-fcta-ctas">
          <Link href="/sign-up" className="l-btnf">Start Free 14-Day Trial →</Link>
          <a href="mailto:hello@craftcapture.com" className="l-btnfg">Talk to us</a>
        </div>
        <p style={{ color: "#475569", fontSize: ".8rem", marginTop: "18px", position: "relative" }}>
          $79/month · No contracts · Cancel anytime
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
