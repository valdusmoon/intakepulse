"use client";

import { useState } from "react";
import { Button } from "./primitives";

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

      <div className="bg-[#101828] text-[#d0d5dd] rounded-[10px] p-3.5 font-cv-mono text-[11px] leading-relaxed whitespace-pre-wrap break-all">
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
