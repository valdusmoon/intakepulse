"use client";

import { useState } from "react";
import { Badge, Icon } from "@/components/dashboard/v2/primitives";

/**
 * A clearly-labeled, purely synthetic "example" lead for the first-run zero-state.
 * It is NOT backed by any database record, so it never navigates to a detail page.
 * Clicking it toggles a tiny inline explainer instead. It only renders while the
 * account has zero real leads (the dashboard gates it behind that condition), so it
 * falls away the moment the first genuine lead lands.
 */
export function ExampleLead() {
  const [open, setOpen] = useState(false);

  return (
    <div id="cv-tour-example" className="px-3 py-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="group grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3.5 rounded-xl border border-dashed border-cv-border bg-cv-surface-subtle/70 px-4 py-3.5 text-left transition-colors hover:border-cv-primary hover:bg-cv-surface-blue"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[11px] bg-cv-red-soft text-xs font-extrabold text-cv-red opacity-80">
            DW
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-extrabold text-cv-ink">Dana Whitfield</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-cv-primary/50 bg-cv-primary-soft px-2 py-[3px] text-[10px] font-extrabold uppercase tracking-wide text-cv-primary">
                <Icon name="lightbulb" className="!text-[12px]" />
                Example
              </span>
              <Badge color="red">Urgent</Badge>
              <Badge color="blue">High intent</Badge>
            </div>
            <div className="mt-1 truncate text-xs text-cv-muted">
              Burst pipe flooding the kitchen, needs water shut off tonight
            </div>
            <div className="mt-[7px] flex flex-wrap items-center gap-2.5 text-[11px] text-cv-muted">
              <span>Estimated $850–$2,400</span>
              <span className="text-cv-border-strong">•</span>
              <span>(512) 555-0148</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="min-w-[60px] text-right">
            <strong className="block font-cv-mono text-xs text-cv-muted">now</strong>
            <span className="mt-0.5 block text-[10px] text-cv-muted">just now</span>
          </div>
        </div>
      </button>

      {open && (
        <div className="mt-2 flex items-start gap-2.5 rounded-xl border border-cv-border bg-cv-surface-blue px-4 py-3">
          <Icon name="info" className="!text-[18px] shrink-0 text-cv-primary" />
          <p className="text-xs leading-relaxed text-cv-ink">
            This is a sample, not a real lead. Your real captured leads show up right here, ranked by urgency and intent,
            each one clickable through to the full call summary and next steps.
          </p>
        </div>
      )}
    </div>
  );
}
