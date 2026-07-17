import { Fragment } from "react";
import { Icon } from "@/components/dashboard/v2/primitives";

/**
 * A 4-step rail shown after checkout so the pay -> pick-number -> publish
 * sequence reads as one intentional flow (the browser leaves for Stripe and
 * comes back, which otherwise feels like the app lost context). Rendered only
 * in the two mid-activation stages:
 *   provisioning  -> active step is "Pick your number"
 *   needs_publish -> active step is "Publish your line"
 */
const STEPS = ["Plan selected", "Pick your number", "Publish your line", "Go live"];

export function GoLiveProgress({ stage }: { stage: "provisioning" | "needs_publish" }) {
  const current = stage === "provisioning" ? 1 : 2;

  return (
    <div className="mb-4 rounded-2xl border border-cv-border bg-cv-surface px-5 py-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-cv-muted mb-3">Go-live progress</p>
      <ol className="flex items-center">
        {STEPS.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <Fragment key={label}>
              <li className="flex items-center gap-2 shrink-0">
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                    done ? "bg-cv-green text-white" : active ? "bg-cv-primary text-white" : "bg-cv-gray-soft text-cv-muted"
                  }`}
                >
                  {done ? <Icon name="check" className="!text-[16px]" /> : i + 1}
                </span>
                <span className={`hidden sm:inline text-xs font-semibold ${active ? "text-cv-ink" : "text-cv-muted"}`}>
                  {label}
                </span>
              </li>
              {i < STEPS.length - 1 && (
                <span className={`mx-2 h-px flex-1 min-w-[12px] ${i < current ? "bg-cv-green" : "bg-cv-border"}`} />
              )}
            </Fragment>
          );
        })}
      </ol>
    </div>
  );
}
