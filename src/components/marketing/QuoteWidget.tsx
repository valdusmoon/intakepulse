"use client";

import { useState, useEffect } from "react";

// ─── Formula (mirrors quote form V1.1) ───────────────────────────────────────

const INTERIOR_WALL_SQFT: Record<string, Record<string, number>> = {
  "1–2 rooms": { "Small home": 700,  "Medium home": 900,  "Large home": 1100 },
  "3–4 rooms": { "Small home": 1300, "Medium home": 1700, "Large home": 2200 },
  "5+ rooms":  { "Small home": 2000, "Medium home": 2700, "Large home": 3500 },
};

const SCOPE_MULT: Record<string, number> = {
  "Walls only": 1.0,
  "Walls + ceilings": 1.25,
  "Walls, ceilings, trim & doors": 1.5,
};

const CONDITION_MULT: Record<string, { low: number; high: number }> = {
  "Good": { low: 1.0, high: 1.0 },
  "Some prep needed": { low: 1.20, high: 1.30 },
  "Significant prep": { low: 1.40, high: 1.60 },
};

function calcEstimate(rooms: string, size: string, scope: string, condition: string): string {
  const baseSqft = INTERIOR_WALL_SQFT[rooms]?.[size] ?? 1200;
  const scopeMult = SCOPE_MULT[scope] ?? 1.25; // "Not sure / other" → walls+ceilings
  const condMult = CONDITION_MULT[condition] ?? { low: 1.0, high: 1.0 };
  const effectiveSqft = baseSqft * scopeMult;
  const gallons = Math.ceil((effectiveSqft / 350) * 2);
  const low  = Math.round(effectiveSqft * 1.5 * condMult.low  + gallons * 25);
  const high = Math.round(effectiveSqft * 2.0 * condMult.high + gallons * 55);
  const roundedLow  = low  < 3000 ? Math.round(low  / 50) * 50  : Math.round(low  / 100) * 100;
  const roundedHigh = high < 3000 ? Math.round(high / 50) * 50  : Math.round(high / 100) * 100;
  return `$${roundedLow.toLocaleString()} – $${roundedHigh.toLocaleString()}`;
}

// ─── Widget ──────────────────────────────────────────────────────────────────

const ROOMS = ["1–2 rooms", "3–4 rooms", "5+ rooms"];
const SIZES = ["Small home", "Medium home", "Large home", "Not sure"];
const SCOPES = ["Walls only", "Walls + ceilings", "Walls, ceilings, trim & doors", "Not sure / other"];
const CONDITIONS = ["Good", "Some prep needed", "Significant prep", "Not sure"];

const TOTAL_STEPS = 8; // steps 1–8 (no viz step)


export function QuoteWidget() {
  const [step, setStep] = useState(1);
  const [rooms, setRooms] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [scope, setScope] = useState<string | null>(null);
  const [condition, setCondition] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "done">("idle");

  useEffect(() => {
    if (uploadState === "uploading") {
      const t = setTimeout(() => setUploadState("done"), 1000);
      return () => clearTimeout(t);
    }
  }, [uploadState]);

  function handleReset() {
    setStep(1);
    setRooms(null);
    setSize(null);
    setScope(null);
    setCondition(null);
    setUploadState("idle");
  }

// "Not sure" on condition maps to "Some prep needed" for the estimate
  const effectiveCondition = condition === "Not sure" ? "Some prep needed" : (condition ?? "Good");
  const estimate = rooms && size && scope
    ? calcEstimate(rooms, size, scope, effectiveCondition)
    : "$2,800 – $4,000";

  const scopeLabel = scope ?? "Walls only";
  const condLabel  = condition === "Not sure" ? "Light prep assumed" : (condition ?? "Good condition");

  return (
    <div>
      <div className="qw">
        <div className="qw-header">
          <div className="qw-dots">
            <div className="qw-dot" style={{ background: "#FF5F57" }} />
            <div className="qw-dot" style={{ background: "#FEBC2E" }} />
            <div className="qw-dot" style={{ background: "#28C840" }} />
          </div>
          <div className="qw-brand">🎨 Get Your Instant Estimate</div>
          <div className="qw-badge">Live Demo</div>
        </div>

        <div className="qw-body">
          <div className="qw-progress">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div key={i} className={`qw-prog${step > i ? " done" : ""}`} />
            ))}
          </div>

          {/* Step 1 — service type */}
          <div className={`qw-step${step === 1 ? " active" : ""}`}>
            <div className="qw-label">Step 1 of {TOTAL_STEPS}</div>
            <div className="qw-hl">What needs painting?</div>
            <div className="qw-chips">
              {["Interior", "Exterior", "Both", "Other"].map((chip) => (
                <div key={chip} className="qw-chip" onClick={() => setStep(2)}>{chip}</div>
              ))}
            </div>
          </div>

          {/* Step 2 — rooms */}
          <div className={`qw-step${step === 2 ? " active" : ""}`}>
            <div className="qw-label">Step 2 of {TOTAL_STEPS}</div>
            <div className="qw-hl">How many rooms?</div>
            <div className="qw-chips">
              {ROOMS.map((r) => (
                <div
                  key={r}
                  className={`qw-chip${rooms === r ? " sel" : ""}`}
                  onClick={() => { setRooms(r); setStep(3); }}
                >{r}</div>
              ))}
            </div>
          </div>

          {/* Step 3 — home size */}
          <div className={`qw-step${step === 3 ? " active" : ""}`}>
            <div className="qw-label">Step 3 of {TOTAL_STEPS}</div>
            <div className="qw-hl">How big is your home?</div>
            <div className="qw-chips">
              {SIZES.map((s) => (
                <div
                  key={s}
                  className={`qw-chip${size === s ? " sel" : ""}`}
                  onClick={() => { setSize(s === "Not sure" ? "Medium home" : s); setStep(4); }}
                >{s}</div>
              ))}
            </div>
          </div>

          {/* Step 4 — scope */}
          <div className={`qw-step${step === 4 ? " active" : ""}`}>
            <div className="qw-label">Step 4 of {TOTAL_STEPS}</div>
            <div className="qw-hl">What are we painting?</div>
            <div className="qw-chips">
              {SCOPES.map((s) => (
                <div
                  key={s}
                  className={`qw-chip${scope === s ? " sel" : ""}`}
                  onClick={() => { setScope(s); setStep(5); }}
                >{s}</div>
              ))}
            </div>
          </div>

          {/* Step 5 — condition */}
          <div className={`qw-step${step === 5 ? " active" : ""}`}>
            <div className="qw-label">Step 5 of {TOTAL_STEPS}</div>
            <div className="qw-hl">How are the surfaces?</div>
            <div className="qw-chips">
              {CONDITIONS.map((c) => (
                <div
                  key={c}
                  className={`qw-chip${condition === c ? " sel" : ""}`}
                  onClick={() => { setCondition(c); setStep(6); }}
                >{c}</div>
              ))}
            </div>
          </div>

          {/* Step 6 — contact (prefilled demo) */}
          <div className={`qw-step${step === 6 ? " active" : ""}`}>
            <div className="qw-label">Step 6 of {TOTAL_STEPS}</div>
            <div className="qw-hl">Where should we send your estimate?</div>
            <div className="qw-prefill">
              <div className="qw-prefill-row"><span className="qw-prefill-lbl">Name</span><span className="qw-prefill-val">Sarah M.</span></div>
              <div className="qw-prefill-row"><span className="qw-prefill-lbl">Phone</span><span className="qw-prefill-val">(555) 847-2291</span></div>
              <div className="qw-prefill-row"><span className="qw-prefill-lbl">Email</span><span className="qw-prefill-val qw-prefill-opt">sarah@email.com</span></div>
            </div>
            <button className="qw-btn" onClick={() => setStep(7)}>Continue →</button>
          </div>

          {/* Step 7 — photos */}
          <div className={`qw-step${step === 7 ? " active" : ""}`}>
            <div className="qw-label">Step 7 of {TOTAL_STEPS}</div>
            <div className="qw-hl">Add photos (optional)</div>
            <div
              className={`qw-upload${uploadState === "done" ? " done" : ""}`}
              onClick={() => { if (uploadState === "idle") setUploadState("uploading"); }}
              style={{ cursor: uploadState === "done" ? "default" : "pointer" }}
            >
              <div className="qw-upload-ico">
                {uploadState === "idle" && "📷"}
                {uploadState === "uploading" && "⏳"}
                {uploadState === "done" && "✅"}
              </div>
              {uploadState === "idle" && <p>Tap to upload photos<br /><strong>Helps the painter prepare before they call</strong></p>}
              {uploadState === "uploading" && <p><strong>Uploading photos...</strong></p>}
              {uploadState === "done" && <p><strong>3 photos uploaded</strong></p>}
            </div>
            <button className="qw-btn" onClick={() => setStep(8)}>
              {uploadState === "done" ? "Submit with photos →" : "Skip — show my estimate →"}
            </button>
          </div>

          {/* Step 8 — result */}
          <div className={`qw-step${step === 8 ? " active" : ""}`}>
            <div className="qw-label">✅ Estimate ready</div>
            <div className="qw-hl">Here&apos;s your ballpark range</div>
            <div className="est-box">
              <div className="est-tag">Instant estimate</div>
              <div className="est-range">{estimate}</div>
              <div className="est-note">
                {rooms ?? "3–4 rooms"} · {size ?? "Medium home"}
              </div>
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                {[
                  `Scope: ${scopeLabel}`,
                  `Condition: ${condLabel}`,
                  "Standard paint · 2-coat repaint",
                  "Ballpark only — final price after on-site visit",
                ].map((a) => (
                  <div key={a} style={{ fontSize: ".74rem", color: "#3B82F6" }}>• {a}</div>
                ))}
              </div>
            </div>
            <button className="qw-btn qw-btn-dark" onClick={handleReset}>← Try again</button>
          </div>


        </div>
      </div>
      <p className="l-widget-note">👆 This is exactly what your homeowners see — interactive demo</p>
    </div>
  );
}
