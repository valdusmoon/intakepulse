"use client";

import { useState } from "react";

/**
 * V7SeeItWork — the "See It Work" example selector (NEW piece). Three tabs
 * (Missed call · Answered call · Website inquiry). Switching a tab swaps ONLY the
 * channel badge, transcript snippet, extracted fields, lead packet, and outcome
 * badge — the layout and framing stay identical, which is the whole point:
 * "Different inputs. Same ranked output." Illustrative scripted content.
 */

type Channel = "phone" | "web";
type Tier = "Hot" | "Warm";

interface Example {
  tab: string;
  channel: Channel;
  /** Small note under the channel badge (e.g. how the call was answered). */
  channelNote: string;
  /** The context badge shown above the packet. */
  badge: string;
  transcript: string;
  fields: string[];
  outcome: { tier: Tier; score: number | null; action: string };
}

const EXAMPLES: Example[] = [
  {
    tab: "Missed call",
    channel: "phone",
    channelNote: "Team rang first · AI answered after ~15s",
    badge: "Nobody picked up — Callverted answered in 14s.",
    transcript: "My water heater just burst, the basement's flooding.",
    fields: ["Water damage", "Emergency", "ZIP 33618", "Shutoff not located", "$1.8k–$3.2k"],
    outcome: { tier: "Hot", score: 92, action: "Call back now" },
  },
  {
    tab: "Answered call",
    channel: "phone",
    channelNote: "Team answered",
    badge: "Your team answered — captured, summarized, and scored anyway.",
    transcript: "It's not cooling at all and it's 84 inside. The system's about 12 years old.",
    fields: ["HVAC repair", "This week", "System 12 yrs"],
    outcome: { tier: "Warm", score: 54, action: "Follow up today" },
  },
  {
    tab: "Website inquiry",
    channel: "web",
    channelNote: "Website widget",
    badge: "Came in through your website widget.",
    transcript: "Need a quote to remodel a bathroom, timeline flexible.",
    fields: ["Bathroom remodel", "Flexible", "$6k–$12k"],
    outcome: { tier: "Warm", score: null, action: "Call within the hour" },
  },
];

const TIER_STYLE: Record<Tier, { pill: string; dot: string }> = {
  Hot: { pill: "bg-[#ffece9] text-[#c0392b] ring-[#f6ccc4]", dot: "bg-[#e5484d]" },
  Warm: { pill: "bg-[#fff3e0] text-[#b45309] ring-[#f6ddb4]", dot: "bg-[#f59e0b]" },
};

function ChannelIcon({ channel }: { channel: Channel }) {
  if (channel === "web") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1L6.6 10.8z" />
    </svg>
  );
}

export function V7SeeItWork() {
  const [active, setActive] = useState(0);
  const ex = EXAMPLES[active];
  const tier = TIER_STYLE[ex.outcome.tier];

  return (
    <div className="rounded-3xl border border-[#e3e7ed] bg-[#f9fafb] p-4 sm:p-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-2" role="tablist" aria-label="Example channels">
        {EXAMPLES.map((e, i) => {
          const on = i === active;
          return (
            <button
              key={e.tab}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setActive(i)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
                on
                  ? "bg-landing-primary text-white shadow-[0_10px_24px_-10px_rgba(36,84,216,0.6)]"
                  : "bg-white text-[#475467] border border-[#e3e7ed] hover:bg-[#f2f5fb]"
              }`}
            >
              <span className={on ? "text-white" : "text-landing-primary"}><ChannelIcon channel={e.channel} /></span>
              {e.tab}
            </button>
          );
        })}
      </div>
      <p className="text-[12.5px] text-[#98a2b3] mb-5 pl-1">Different inputs. Same ranked output.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        {/* Left — channel + transcript */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b1226] p-6 sm:p-7 flex flex-col">
          <div className="pointer-events-none absolute -top-16 -left-10 h-44 w-44 rounded-full bg-landing-primary/20 blur-3xl" aria-hidden />
          <div className="relative flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white ring-1 ring-white/15">
              <span className="text-landing-primary-glow"><ChannelIcon channel={ex.channel} /></span>
              {ex.tab}
            </span>
            <span className="text-[11px] text-white/45">{ex.channelNote}</span>
          </div>
          <p className="relative font-cv-heading text-[21px] sm:text-[24px] font-semibold leading-relaxed text-white/90 min-h-[112px]">
            &ldquo;{ex.transcript}&rdquo;
          </p>
          <div className="relative mt-auto pt-5 flex items-center gap-2 text-[12px] text-white/45">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3a9 9 0 1 0 9 9" /><path d="M12 7v5l3 2" /></svg>
            Captured live. Nobody typed a thing.
          </div>
        </div>

        {/* Right — extracted fields + scored lead packet */}
        <div className="rounded-3xl border border-[#e3e7ed] bg-white p-6 sm:p-7 flex flex-col">
          <p className="text-[11px] font-bold uppercase tracking-widest text-landing-primary mb-3">Understood</p>
          <div className="flex flex-wrap gap-2 mb-5">
            {ex.fields.map((f) => (
              <span key={f} className="inline-flex items-center gap-1.5 rounded-full border border-landing-primary/20 bg-[#eef3ff] px-3 py-1.5 text-[12.5px] font-semibold text-landing-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-landing-primary" />
                {f}
              </span>
            ))}
          </div>

          <div className="mt-auto rounded-2xl border border-[#e6ebf2] bg-[#f9fafb] p-4">
            <div className="flex items-center justify-between mb-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11.5px] font-bold text-[#152033] ring-1 ring-[#e3e7ed]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#23a35a]" /> Job
              </span>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-bold ring-1 ${tier.pill}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${tier.dot}`} />
                {ex.outcome.tier}
                {ex.outcome.score !== null && <span className="opacity-70">· {ex.outcome.score}</span>}
              </span>
            </div>
            <p className="text-[10px] uppercase tracking-wide text-[#98a2b3] font-semibold">Recommended action</p>
            <p className="font-cv-heading text-[17px] font-bold text-landing-primary">{ex.outcome.action}</p>
          </div>

          <p className="mt-3 rounded-xl bg-[#f2f5fb] px-3.5 py-2.5 text-[12.5px] font-medium text-[#475467]">{ex.badge}</p>
        </div>
      </div>
    </div>
  );
}
