/**
 * ⚠️ PLACEHOLDER SOCIAL PROOF — NOT REAL CUSTOMERS. ⚠️
 *
 * The logos and testimonials below are INVENTED trade-company names and made-up
 * quotes, used only to prototype the layout/feel of a "trusted by" logo carousel
 * and a testimonials row. They must be replaced with REAL customer logos and
 * REAL, attributable quotes (with permission) before this is shown to the public.
 * Do NOT ship this as-is — shipping fabricated customer proof is deceptive and an
 * FTC/advertising liability. This file is intentionally not wired for launch.
 */

// Invented trade companies, each with a designed icon mark + brand color, so the
// carousel reads like a real logo wall (varied marks/colors) — WITHOUT borrowing
// any real company's trademark. Icons are single-path SVGs.
type Mark = { name: string; color: string; d: string };
const LOGOS: Mark[] = [
  { name: "Northside Restoration", color: "#1f6feb", d: "M12 2s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z" }, // water drop
  { name: "Apex HVAC & Air", color: "#0e9f8f", d: "M3 18l6-9 4 5 3-4 5 8z" }, // peaks
  { name: "BlueLine Plumbing", color: "#2454d8", d: "M6 3h6a4 4 0 0 1 0 8H9v10H6V3zm3 5h3a1 1 0 0 0 0-2H9v2z" }, // pipe "P"
  { name: "Ironclad Electric", color: "#e8a90a", d: "M13 2 3 14h7l-1 8 10-12h-7l1-8z" }, // bolt
  { name: "Summit Roofing Co.", color: "#475467", d: "M12 4 2 12h3v8h6v-5h2v5h6v-8h3L12 4z" }, // house/roof
  { name: "RapidDry Restoration", color: "#0aa3c2", d: "M12 3a9 9 0 1 0 9 9h-3a6 6 0 1 1-6-6V3z" }, // fan swirl
  { name: "TrueFlow Plumbing", color: "#0f9d64", d: "M2 13c3-5 6-5 9 0s6 5 9 0v4c-3 5-6 5-9 0s-6-5-9 0v-4z" }, // wave
  { name: "Cardinal Heating & Cooling", color: "#c0392b", d: "M12 2c1 4 4 5 4 9a4 4 0 0 1-8 0c0-2 2-3 2-5 0-2-1-3 2-4z" }, // flame
];

// Invented testimonials — placeholder copy only.
const TESTIMONIALS = [
  {
    quote:
      "We used to lose every after-hours call to voicemail. Now they show up the next morning already qualified, with the urgent ones flagged first.",
    name: "Marcus D.",
    role: "Owner, Apex HVAC & Air",
    initials: "MD",
    tone: "primary" as const,
  },
  {
    quote:
      "The lead packet tells me who to call first. I closed a $6k water job last month that I'd have completely missed.",
    name: "Renee T.",
    role: "Northside Restoration",
    initials: "RT",
    tone: "green" as const,
  },
  {
    quote:
      "Setup took me about twenty minutes and it's just been running by itself since. It pays for itself on one recovered job.",
    name: "Carlos M.",
    role: "BlueLine Plumbing",
    initials: "CM",
    tone: "purple" as const,
  },
];

const TONES: Record<string, string> = {
  primary: "bg-landing-primary/10 text-landing-primary",
  green: "bg-[#eaf7f0] text-[#177245]",
  purple: "bg-[#f4f0ff] text-[#6941c6]",
};

/** Infinite, edge-faded logo carousel. Two copies of the set sit back-to-back so
 *  the -50% translate loops seamlessly. */
export function LogoMarquee() {
  const doubled = [...LOGOS, ...LOGOS];
  return (
    <section className="border-b border-[#e3e7ed] bg-white px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-[#98a2b3] mb-7">
          Trusted by home-service teams across the country
        </p>
        <div
          className="cv-marquee relative overflow-hidden"
          style={{
            maskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
            WebkitMaskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
          }}
        >
          <div className="cv-marquee-track gap-10 sm:gap-14 items-center">
            {doubled.map((logo, i) => (
              <span key={i} className="flex shrink-0 items-center gap-2.5 whitespace-nowrap">
                <span
                  className="grid h-8 w-8 place-items-center rounded-lg text-white shadow-sm"
                  style={{ background: logo.color }}
                  aria-hidden
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                    <path d={logo.d} />
                  </svg>
                </span>
                <span className="font-cv-heading text-[17px] font-extrabold tracking-tight text-[#344054]">
                  {logo.name}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Testimonials row — three placeholder quotes as cards. */
export function Testimonials() {
  return (
    <section className="px-6 py-20 sm:py-24 bg-[#f9fafb] border-b border-[#e3e7ed]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-landing-primary mb-3">What owners say</p>
          <h2 className="font-cv-heading text-3xl sm:text-4xl font-bold tracking-tight text-[#152033] leading-tight">
            The calls you were losing, turned into booked jobs.
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="flex flex-col rounded-2xl border border-[#e3e7ed] bg-white p-7 shadow-sm">
              <div className="mb-4 flex gap-0.5 text-landing-amber" aria-hidden>
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.3l-6.16 3.7 1.64-7.03L2 9.24l7.19-.61L12 2l2.81 6.63 7.19.61-5.48 4.73 1.64 7.03z" /></svg>
                ))}
              </div>
              <blockquote className="flex-1 text-[15px] leading-relaxed text-[#344054]">“{t.quote}”</blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span className={`grid h-10 w-10 place-items-center rounded-full font-cv-heading text-sm font-bold ${TONES[t.tone]}`}>
                  {t.initials}
                </span>
                <span>
                  <span className="block text-sm font-bold text-[#152033]">{t.name}</span>
                  <span className="block text-[12.5px] text-[#667085]">{t.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
