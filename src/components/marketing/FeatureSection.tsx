"use client";

import { useState } from "react";

const FEATURES = [
  {
    icon: "📋",
    title: "Homeowner Quote Form",
    desc: "Mobile-first tap questionnaire. Works as a shareable link or QR code. Homeowners get an instant estimate in under 2 minutes — no typing required.",
  },
  {
    icon: "🧠",
    title: "Instant Estimates + AI Photo Notes",
    desc: "A 4-question form calculates a ballpark estimate instantly. Homeowners can upload photos and get an AI-written condition summary — so you show up to every estimate already knowing what to expect.",
  },
  {
    icon: "🎨",
    title: "AI Color Visualizer",
    desc: "After getting their estimate, homeowners can pick a paint color and see it applied to their home via AI. More color confidence = fewer second-guessing calls to you.",
  },
  {
    icon: "📊",
    title: "Lead Pipeline Dashboard",
    desc: "Every lead in one place. Full status tracking: New → Contacted → Quoted → Scheduled → Won. Search, filter, add private notes.",
  },
  {
    icon: "✏️",
    title: "Manual Lead Entry",
    desc: "Got a walk-in or phone call? Add them manually in seconds with optional AI photo notes.",
  },
];

export function FeatureSection() {
  const [active, setActive] = useState(0);

  return (
    <div className="l-feat-wrap">
      <div className="l-feat-list">
        {FEATURES.map((f, i) => (
          <div
            key={i}
            className={`l-fi${active === i ? " active" : ""}`}
            onClick={() => setActive(i)}
          >
            <div className="l-fi-ico">{f.icon}</div>
            <div>
              <h4>{f.title}</h4>
              <p>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Dashboard mock — matches real /dashboard/leads table */}
      <div className="l-dash">
        <div className="l-dash-top">
          <div className="l-ddots">
            <div className="l-ddot" style={{ background: "#FF5F57" }} />
            <div className="l-ddot" style={{ background: "#FEBC2E" }} />
            <div className="l-ddot" style={{ background: "#28C840" }} />
          </div>
          <div className="l-durl">app.craftcapture.com/dashboard/leads</div>
        </div>

        <div className="l-dash-in" style={{ padding: "14px" }}>
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontFamily: "var(--font-sora)", fontWeight: 800, fontSize: "1rem", color: "var(--navy)" }}>Leads</div>
            <div style={{ background: "#F97316", color: "white", fontSize: ".72rem", fontWeight: 700, padding: "5px 10px", borderRadius: 7 }}>+ Add lead</div>
          </div>

          {/* Table */}
          <div style={{ border: "1px solid #E2E8F0", borderRadius: 10, overflow: "hidden", fontSize: ".72rem" }}>
            {/* Column headers */}
            <div style={{ display: "grid", gridTemplateColumns: "1.8fr 0.8fr 1fr 0.7fr 0.6fr", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", padding: "6px 10px", gap: 6 }}>
              {["Contact", "Service", "Estimate", "Status", "Received"].map((h) => (
                <div key={h} style={{ fontWeight: 700, fontSize: ".62rem", color: "#64748B", textTransform: "uppercase", letterSpacing: ".06em" }}>{h}</div>
              ))}
            </div>

            {/* Row 1 */}
            <div style={{ display: "grid", gridTemplateColumns: "1.8fr 0.8fr 1fr 0.7fr 0.6fr", padding: "9px 10px", gap: 6, borderBottom: "1px solid #E2E8F0", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600, color: "#1E293B", display: "flex", alignItems: "center", gap: 4 }}>
                  Sarah M.
                  <span style={{ fontSize: ".58rem", fontWeight: 700, background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", padding: "1px 5px", borderRadius: 100 }}>NEW</span>
                </div>
                <div style={{ color: "#F97316", fontWeight: 600, marginTop: 1 }}>(214) 555-0182</div>
              </div>
              <div style={{ color: "#1E293B" }}>Interior</div>
              <div style={{ fontWeight: 600, color: "#1E293B" }}>$1,800–$2,550</div>
              <div><span style={{ fontSize: ".62rem", fontWeight: 700, background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", padding: "2px 7px", borderRadius: 100 }}>New</span></div>
              <div style={{ color: "#94A3B8" }}>2m ago</div>
            </div>

            {/* Row 2 */}
            <div style={{ display: "grid", gridTemplateColumns: "1.8fr 0.8fr 1fr 0.7fr 0.6fr", padding: "9px 10px", gap: 6, borderBottom: "1px solid #E2E8F0", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600, color: "#1E293B" }}>James R.</div>
                <div style={{ color: "#F97316", fontWeight: 600, marginTop: 1 }}>(469) 555-0247</div>
              </div>
              <div style={{ color: "#1E293B" }}>Exterior</div>
              <div style={{ fontWeight: 600, color: "#1E293B" }}>$4,200–$6,100</div>
              <div><span style={{ fontSize: ".62rem", fontWeight: 700, background: "#FAF5FF", color: "#7C3AED", border: "1px solid #DDD6FE", padding: "2px 7px", borderRadius: 100 }}>Quoted</span></div>
              <div style={{ color: "#94A3B8" }}>1h ago</div>
            </div>

            {/* Row 3 */}
            <div style={{ display: "grid", gridTemplateColumns: "1.8fr 0.8fr 1fr 0.7fr 0.6fr", padding: "9px 10px", gap: 6, alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600, color: "#1E293B" }}>Linda K.</div>
                <div style={{ color: "#F97316", fontWeight: 600, marginTop: 1 }}>(972) 555-0391</div>
              </div>
              <div style={{ color: "#1E293B" }}>Both</div>
              <div style={{ fontWeight: 600, color: "#1E293B" }}>$6,500–$9,200</div>
              <div><span style={{ fontSize: ".62rem", fontWeight: 700, background: "#F0FDF4", color: "#15803D", border: "1px solid #BBF7D0", padding: "2px 7px", borderRadius: 100 }}>Won</span></div>
              <div style={{ color: "#94A3B8" }}>Yesterday</div>
            </div>
          </div>

          {/* AI photo summary card */}
          <div className="l-ai-box" style={{ marginTop: 10 }}>
            <div className="l-ai-top">
              <div className="l-ai-lbl">📷 Photo Assessment — Sarah M.</div>
              <span style={{ fontSize: ".6rem", fontWeight: 700, background: "#F1F5F9", color: "#64748B", padding: "2px 7px", borderRadius: 100 }}>AI</span>
            </div>
            <div className="l-ai-sub" style={{ lineHeight: 1.5 }}>
              Walls appear to be in good condition with no visible peeling or damage. Ceiling is smooth with standard height. Prep work should be minimal — good candidate for a 2-coat repaint.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
