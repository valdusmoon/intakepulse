"use client";

import { useState } from "react";
import { Icon, Badge, type BadgeColor } from "@/components/dashboard/v2/primitives";
import type { CallTranscriptEntry } from "@/lib/db/schema/calls";

interface OutcomeMeta {
  label: string;
  icon: string;
  iconClass: string;
  sub: string;
}

export function CallRow({
  callerPhone,
  dateTime,
  outcomeMeta,
  service,
  duration,
  leadId,
  priority,
  summary,
  transcript,
}: {
  callerPhone: string;
  dateTime: string;
  outcomeMeta: OutcomeMeta;
  service: string | null;
  duration: string;
  leadId: string | null;
  priority: { label: string; color: BadgeColor } | null;
  summary: string | null;
  transcript: CallTranscriptEntry[] | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = Boolean(summary || (transcript && transcript.length > 0));

  return (
    <>
      <tr className="hover:bg-[#fbfcfd] border-b border-cv-border last:border-b-0">
        <td className="px-3.5 py-3.5 text-xs align-middle">
          <strong className="block text-[13px]">{callerPhone}</strong>
        </td>
        <td className="px-3.5 py-3.5 text-xs align-middle whitespace-nowrap">{dateTime}</td>
        <td className="px-3.5 py-3.5 align-middle">
          <div className="flex items-center gap-1.5">
            <div className={`w-[31px] h-[31px] rounded-[9px] grid place-items-center shrink-0 ${outcomeMeta.iconClass}`}>
              <Icon name={outcomeMeta.icon} className="!text-[17px]" />
            </div>
            <div>
              <strong className="block text-[13px]">{outcomeMeta.label}</strong>
              <div className="text-[11px] text-cv-muted">{outcomeMeta.sub}</div>
            </div>
          </div>
        </td>
        <td className="px-3.5 py-3.5 text-xs align-middle">{service ?? "—"}</td>
        <td className="px-3.5 py-3.5 align-middle font-cv-mono text-xs">{duration}</td>
        <td className="px-3.5 py-3.5 align-middle">
          {leadId && priority ? <Badge color={priority.color}>{priority.label}</Badge> : <span className="text-cv-muted text-xs">—</span>}
        </td>
        <td className="px-3.5 py-3.5 align-middle text-right">
          {hasDetails ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex items-center gap-1 text-cv-primary text-xs font-bold hover:underline whitespace-nowrap"
            >
              <Icon name={expanded ? "expand_less" : "expand_more"} className="!text-base" />
              Details
            </button>
          ) : (
            <span className="text-cv-muted text-xs">—</span>
          )}
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-cv-border bg-cv-surface-subtle">
          <td colSpan={7} className="px-4 py-4">
            <div className="flex flex-col gap-3 max-w-3xl">
              <div>
                <p className="text-[10px] uppercase tracking-wide font-extrabold text-cv-muted mb-1.5">Summary</p>
                <p className="text-[13px] leading-relaxed text-cv-ink">{summary ?? "No summary was generated for this call."}</p>
              </div>
              {transcript && transcript.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wide font-extrabold text-cv-muted mb-1.5">Transcript</p>
                  <div className="flex flex-col gap-2 max-h-64 overflow-y-auto border border-cv-border rounded-[11px] p-3.5 bg-white">
                    {transcript.map((entry, i) => (
                      <p key={i} className="text-[13px] leading-relaxed">
                        <span className={`font-bold ${entry.role === "assistant" ? "text-cv-primary" : "text-cv-ink"}`}>
                          {entry.role === "assistant" ? "Callverted: " : "Caller: "}
                        </span>
                        {entry.message}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
