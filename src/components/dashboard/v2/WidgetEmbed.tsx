"use client";

import { useState } from "react";
import { Button, Icon } from "./primitives";

const APP_URL =
  typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL ?? "https://app.callverted.com";

const WIDGET_MODES = [
  { key: "popup", label: "Popup" },
  { key: "inline", label: "Inline embed" },
  { key: "button", label: "Button link" },
] as const;

type WidgetMode = (typeof WIDGET_MODES)[number]["key"];

export function WidgetEmbed({ businessId }: { businessId: string }) {
  const [mode, setMode] = useState<WidgetMode>("popup");
  const [copied, setCopied] = useState(false);

  const intakeUrl = `${APP_URL}/intake/${businessId}`;

  const snippets: Record<WidgetMode, string> = {
    popup: `<script src="${APP_URL}/api/widget/${businessId}" defer></script>`,
    inline: `<div data-ip-embed></div>\n<script src="${APP_URL}/api/widget/${businessId}?mode=inline" defer></script>`,
    button: `<div data-ip-button></div>\n<script src="${APP_URL}/api/widget/${businessId}?mode=button" defer></script>`,
  };

  const descriptions: Record<WidgetMode, string> = {
    popup: "Adds a floating button to your site. Clicking it opens the intake form in a modal overlay.",
    inline: "Embeds the intake form directly on the page inside the div. Add the div wherever you want the form.",
    button: "Injects a styled button that opens the intake form in a new tab. Drop the div anywhere on your page.",
  };

  const snippet = snippets[mode];

  function copy() {
    navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <div>
      <div className="flex gap-1 bg-cv-gray-soft rounded-lg p-1 mb-3.5 w-fit">
        {WIDGET_MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => {
              setMode(m.key);
              setCopied(false);
            }}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition-colors ${
              mode === m.key ? "bg-white text-cv-ink shadow-cv-sm" : "text-cv-muted hover:text-cv-ink"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <WidgetPreview mode={mode} />

      <div className="bg-[#101828] text-[#d0d5dd] rounded-[10px] p-3.5 font-cv-mono text-[11px] leading-relaxed whitespace-pre-wrap break-all mt-3">
        {snippet}
      </div>

      <div className="flex items-center gap-3 mt-3">
        <Button size="sm" onClick={copy}>
          {copied ? "Copied ✓" : "Copy code"}
        </Button>
        <a href={intakeUrl} target="_blank" rel="noopener noreferrer" className="text-cv-primary text-[13px] font-bold hover:underline">
          Preview form ↗
        </a>
      </div>

      <p className="text-[11px] text-cv-muted mt-3 leading-relaxed">{descriptions[mode]}</p>
    </div>
  );
}

/** A tiny "browser" mockup showing where the widget appears and how it behaves on a real page. */
function WidgetPreview({ mode }: { mode: WidgetMode }) {
  return (
    <div className="relative rounded-[10px] border border-cv-border bg-white overflow-hidden h-[132px] mb-1">
      {/* Browser chrome */}
      <div className="h-5 bg-cv-surface-subtle border-b border-cv-border flex items-center gap-1 px-2">
        <span className="w-1.5 h-1.5 rounded-full bg-cv-border-strong" />
        <span className="w-1.5 h-1.5 rounded-full bg-cv-border-strong" />
        <span className="w-1.5 h-1.5 rounded-full bg-cv-border-strong" />
      </div>

      {/* Page content skeleton */}
      <div className="p-3 flex flex-col gap-1.5">
        <div className="h-1.5 w-2/3 rounded-full bg-cv-gray-soft" />
        <div className="h-1.5 w-5/6 rounded-full bg-cv-gray-soft" />
        <div className="h-1.5 w-1/2 rounded-full bg-cv-gray-soft" />

        {mode === "inline" && (
          <div className="mt-1.5 rounded-md border border-dashed border-cv-primary bg-cv-primary-soft/40 p-2 flex flex-col gap-1.5">
            <div className="h-1.5 w-1/3 rounded-full bg-cv-primary/30" />
            <div className="h-4 w-full rounded bg-white border border-cv-border" />
            <div className="h-4 w-full rounded bg-white border border-cv-border" />
          </div>
        )}

        {mode === "button" && (
          <div className="mt-2 inline-flex items-center gap-1 self-start bg-cv-primary text-white text-[9px] font-bold px-2.5 py-1.5 rounded-md">
            Get a Free Quote
          </div>
        )}
      </div>

      {mode === "popup" && (
        <>
          {/* The opened widget panel */}
          <div className="absolute bottom-9 right-2.5 w-[104px] rounded-lg border border-cv-border bg-white shadow-cv-sm p-2 flex flex-col gap-1">
            <div className="h-1.5 w-2/3 rounded-full bg-cv-primary-soft" />
            <div className="h-1.5 w-full rounded-full bg-cv-gray-soft" />
            <div className="h-3.5 w-full rounded bg-cv-surface-subtle border border-cv-border" />
          </div>
          {/* The floating launcher button */}
          <div className="absolute bottom-2.5 right-2.5 w-7 h-7 rounded-full bg-cv-primary text-white grid place-items-center shadow-cv-sm">
            <Icon name="chat_bubble" filled className="!text-sm" />
          </div>
        </>
      )}
    </div>
  );
}
