"use client";

import { useState } from "react";

import { BrowserFrame, MediaSlot } from "./MediaSlot";

/**
 * STICKY-PREVIEW STEP SWITCHER for the /v4 product-tour draft.
 *
 * The long-page compression device: six onboarding steps that would otherwise
 * cost six full-width sections collapse into one. Left is a single preview pane
 * that sticks while you scroll; right is the clickable step list. Clicking swaps
 * the preview instead of scrolling you somewhere new.
 *
 * On mobile the two columns stack and the preview sits above the list, so the
 * thing you just tapped is the thing above your thumb.
 *
 * Real <button> elements, so it is tabbable and Enter/Space work. The active
 * step carries aria-current and points at the preview region via aria-controls.
 */

const STEPS = [
  {
    title: "Publish your Callverted number",
    desc: "One number that rings your team first on every call.",
    url: "app.callverted.com/settings/phone",
    slotTitle: "Screen recording: phone setup",
    slotNote: "Owner sees their Callverted number and the ring-team-first order.",
    slotPrompt:
      "Screen-record Settings > Phone. Show the assigned Callverted number at the top, then the call-flow list below it: ring team first, 15s, then Callverted answers. Drag the team member row to reorder so the viewer sees the routing is theirs to control. End on the copy-number button with a copied toast. ~10s, no cursor trails.",
  },
  {
    title: "Approve your services and pricing",
    desc: "Nothing is quoted that you did not sign off on.",
    url: "app.callverted.com/settings/services",
    slotTitle: "Screen recording: services and pricing approval",
    slotNote: "Adding a service, typing a price range, toggling it approved.",
    slotPrompt:
      "Screen-record Settings > Services. Start with three existing services listed with price ranges. Click Add service, type 'Water damage mitigation', enter $1,800 to $3,200, flip the 'Quote this price to callers' toggle on, save. The row appears with an Approved badge. Viewer should see that pricing is an explicit opt-in per service. ~12s.",
  },
  {
    title: "Set your intake questions",
    desc: "The questions a good dispatcher would ask, in your words.",
    url: "app.callverted.com/settings/questions",
    slotTitle: "Screen recording: intake question builder",
    slotNote: "Reordering questions and switching one on for a single service.",
    slotPrompt:
      "Screen-record the intake question builder. Show the default question list, drag 'Is water still actively coming in?' above 'What is the property type?', then open a question and switch its visibility to 'Water damage only'. The conditional-logic hint should be legible. End with the saved state. ~12s.",
  },
  {
    title: "Run a test call together",
    desc: "You hear exactly what your customer will hear before launch.",
    url: "app.callverted.com/onboarding/test-call",
    slotTitle: "Screen recording: guided test call",
    slotNote: "Test-call step with the live transcript filling in as it runs.",
    slotPrompt:
      "Screen-record the onboarding test-call step. Click 'Call me now', show the ringing state, then the transcript panel filling line by line as the call runs: greeting, service question, urgency question, the closing reassurance naming the business. Finish on the green 'Test call complete' state with the resulting lead card. ~18s, screen only, audio optional.",
  },
  {
    title: "Go live and get ranked alerts",
    desc: "Leads land scored, in one list, in about a minute.",
    url: "app.callverted.com/dashboard",
    slotTitle: "Screen recording: go-live and first ranked lead",
    slotNote: "Flipping live, then a new Hot lead arriving at the top of the queue.",
    slotPrompt:
      "Screen-record the go-live stepper completing, then cut to the dashboard priority queue. A new lead animates into position one with a Hot 92 badge, pushing a Warm lead down. Hover it so the row highlights and the next-action chip reads 'Call within 10 minutes'. ~12s.",
  },
  {
    title: "Read the weekly recap",
    desc: "What came in, what got called back, what it was worth.",
    url: "app.callverted.com/reports",
    slotTitle: "Screen recording: weekly recap report",
    slotNote: "Scrolling the weekly report: volume, response time, captured value.",
    slotPrompt:
      "Screen-record the Reports page for a full week of data. Slowly scroll through: lead volume by source, callback response time, captured opportunity value, and the lead-source breakdown chart. Change the date range once so the numbers update. ~15s, smooth scroll, no jitter.",
  },
];

export function V4StepTour() {
  const [active, setActive] = useState(0);
  const step = STEPS[active];

  return (
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1.22fr_0.78fr] lg:gap-12">
      {/* Preview pane — sticks on desktop, sits above the list on mobile */}
      <div className="lg:sticky lg:top-24">
        <BrowserFrame url={step.url}>
          <div id="v4-step-preview" role="region" aria-live="polite" className="p-2.5 sm:p-3">
            <MediaSlot
              kind="video"
              className="aspect-[16/10]"
              title={step.slotTitle}
              note={step.slotNote}
              prompt={step.slotPrompt}
              dims="1600×1000 · mp4 loop"
            />
          </div>
        </BrowserFrame>
        <p className="font-cv-mono mt-3 text-[11px] text-[#98a2b3]">
          Step {active + 1} of {STEPS.length} · {step.title}
        </p>
      </div>

      {/* Step list */}
      <ul className="flex flex-col gap-2">
        {STEPS.map((s, i) => {
          const on = i === active;
          return (
            <li key={s.title}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-current={on ? "true" : undefined}
                aria-controls="v4-step-preview"
                className={`flex w-full items-start gap-3.5 rounded-2xl border px-4 py-4 text-left transition-colors ${
                  on
                    ? "border-landing-primary/35 bg-[#eef3ff]"
                    : "border-[#e3e7ed] bg-white hover:border-[#cbd5e5] hover:bg-[#f9fafb]"
                }`}
              >
                <span
                  className={`font-cv-heading mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-[13px] font-bold ${
                    on ? "bg-landing-primary text-white" : "bg-[#eef1f4] text-[#98a2b3]"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <span
                    className={`font-cv-heading block text-[15px] font-bold leading-snug ${
                      on ? "text-landing-primary" : "text-[#152033]"
                    }`}
                  >
                    {s.title}
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-relaxed text-[#667085]">{s.desc}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
