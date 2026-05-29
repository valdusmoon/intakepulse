"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { validateAndNormalizePhone } from "@/lib/utils/phone-validation";
import { validateAndNormalizeEmail } from "@/lib/utils/email-validation";
import { uploadLeadPhoto } from "@/lib/storage";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Company {
  businessName: string;
  ownerPhone: string;
  serviceArea: string | null;
  logoUrl: string | null;
  subscriptionActive: boolean;
  laborRate: number | null;
  paintTier: string;
}

interface Answers {
  serviceType: "interior" | "exterior" | "both" | "other" | "";
  rooms: "1-2" | "3-4" | "5+" | "";
  homeSize: "small" | "medium" | "large" | "";
  scope: "walls_only" | "walls_ceilings" | "walls_ceilings_trim_doors" | "";
  interiorCondition: "good" | "some_prep" | "significant_prep" | "";
  stories: "1" | "2" | "3+" | "";
  exteriorCondition: "good" | "fair" | "poor" | "";
  exteriorSize: "small" | "medium" | "large" | "";
  timeline: string;
}

interface Contact {
  name: string;
  phone: string;
  email: string;
  address: string;
  smsConsent: boolean;
}

interface ContactErrors {
  name?: string;
  phone?: string;
  email?: string;
}

interface EstimateResult {
  low: number;
  high: number;
  assumptions: string[];
  jobs: Array<{ name: string; low: number; high: number }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

// ─── V1.1 Estimate engine (client-side, no AI) ────────────────────────────────

const INTERIOR_WALL_SQFT: Record<string, Record<string, number>> = {
  "1-2": { small: 700,  medium: 900,  large: 1100 },
  "3-4": { small: 1300, medium: 1700, large: 2200 },
  "5+":  { small: 2000, medium: 2700, large: 3500 },
};

const EXTERIOR_WALL_SQFT: Record<string, number> = {
  "1": 1600,
  "2": 2800,
  "3+": 4200,
};

// Scope multiplier applied to base sqft to get effective paintable area
const SCOPE_MULT: Record<string, number> = {
  walls_only:                1.0,
  walls_ceilings:            1.25,
  walls_ceilings_trim_doors: 1.5,
};

const INTERIOR_CONDITION_MULT: Record<string, { low: number; high: number }> = {
  good:            { low: 1.0,  high: 1.0  },
  some_prep:       { low: 1.20, high: 1.30 },
  significant_prep:{ low: 1.40, high: 1.60 },
};

const EXTERIOR_CONDITION_MULT: Record<string, { low: number; high: number }> = {
  good: { low: 1.0,  high: 1.0  },
  fair: { low: 1.20, high: 1.30 },
  poor: { low: 1.40, high: 1.60 },
};

const BASE_LABOR_RATE = { low: 1.50, high: 2.00 };
const DEFAULT_GOOD_MIDPOINT = 1.75;

const PAINT_COST_PER_GALLON: Record<string, { low: number; high: number }> = {
  budget:   { low: 20, high: 35 },
  standard: { low: 25, high: 55 },
  premium:  { low: 55, high: 85 },
};
const SQFT_PER_GALLON = 350;

function roundEstimate(n: number): number {
  if (n < 3000) return Math.round(n / 50) * 50;
  return Math.round(n / 100) * 100;
}

const SCOPE_LABELS: Record<string, string> = {
  walls_only:                "Walls only",
  walls_ceilings:            "Walls + ceilings",
  walls_ceilings_trim_doors: "Walls, ceilings, trim & doors",
};

const INTERIOR_CONDITION_LABELS: Record<string, string> = {
  good:            "Good condition",
  some_prep:       "Some prep needed",
  significant_prep:"Significant prep needed",
};

const EXTERIOR_CONDITION_LABELS: Record<string, string> = {
  good: "Good condition",
  fair: "Fair condition — some prep",
  poor: "Poor condition — significant prep",
};

function calcInteriorPrice(
  rooms: string, homeSize: string, scope: string, condition: string,
  laborRate: number | null, paintTier: string,
): { low: number; high: number; sqft: number } {
  const baseSqft = INTERIOR_WALL_SQFT[rooms]?.[homeSize] ?? 1200;
  const scopeMult = SCOPE_MULT[scope] ?? 1.0;
  const condMult = INTERIOR_CONDITION_MULT[condition] ?? INTERIOR_CONDITION_MULT.good;
  const scale = laborRate ? laborRate / DEFAULT_GOOD_MIDPOINT : 1;
  const effectiveSqft = baseSqft * scopeMult;
  const gallons = Math.ceil((effectiveSqft / SQFT_PER_GALLON) * 2);
  const paint = PAINT_COST_PER_GALLON[paintTier] ?? PAINT_COST_PER_GALLON.standard;
  const low  = Math.max(500, roundEstimate(effectiveSqft * BASE_LABOR_RATE.low  * condMult.low  * scale + gallons * paint.low));
  const high = Math.max(500, roundEstimate(effectiveSqft * BASE_LABOR_RATE.high * condMult.high * scale + gallons * paint.high));
  return { low, high, sqft: Math.round(effectiveSqft) };
}

function calcExteriorPrice(
  stories: string, condition: string, laborRate: number | null, paintTier: string,
): { low: number; high: number; sqft: number } {
  const sqft = EXTERIOR_WALL_SQFT[stories] ?? 1600;
  const condMult = EXTERIOR_CONDITION_MULT[condition] ?? EXTERIOR_CONDITION_MULT.good;
  const scale = laborRate ? laborRate / DEFAULT_GOOD_MIDPOINT : 1;
  const gallons = Math.ceil((sqft / SQFT_PER_GALLON) * 2);
  const paint = PAINT_COST_PER_GALLON[paintTier] ?? PAINT_COST_PER_GALLON.standard;
  const low  = Math.max(1200, roundEstimate(sqft * BASE_LABOR_RATE.low  * condMult.low  * scale + gallons * paint.low));
  const high = Math.max(1200, roundEstimate(sqft * BASE_LABOR_RATE.high * condMult.high * scale + gallons * paint.high));
  return { low, high, sqft };
}

function buildInstantEstimate(answers: Answers, laborRate: number | null, paintTier: string): EstimateResult | null {
  if (answers.serviceType === "other" || !answers.serviceType) return null;

  const jobs: EstimateResult["jobs"] = [];
  const paintLabel = paintTier === "budget" ? "$20–$35" : paintTier === "premium" ? "$55–$85" : "$25–$55";
  const assumptions: string[] = [];

  if ((answers.serviceType === "interior" || answers.serviceType === "both") && answers.rooms && answers.homeSize) {
    const scope = answers.scope || "walls_only";
    const condition = answers.interiorCondition || "good";
    const result = calcInteriorPrice(answers.rooms, answers.homeSize, scope, condition, laborRate, paintTier);
    jobs.push({ name: "Interior", low: result.low, high: result.high });
    assumptions.push(`~${result.sqft} sqft interior · ${SCOPE_LABELS[scope] ?? scope}`);
    if (condition !== "good") assumptions.push(`Interior prep: ${INTERIOR_CONDITION_LABELS[condition] ?? condition}`);
  }

  if ((answers.serviceType === "exterior" || answers.serviceType === "both") && answers.stories) {
    const condition = answers.exteriorCondition || "good";
    const result = calcExteriorPrice(answers.stories, condition, laborRate, paintTier);
    jobs.push({ name: "Exterior", low: result.low, high: result.high });
    assumptions.push(`~${result.sqft} sqft exterior · ${answers.stories}-story`);
    if (condition !== "good") assumptions.push(`Exterior prep: ${EXTERIOR_CONDITION_LABELS[condition] ?? condition}`);
  }

  if (jobs.length === 0) return null;

  const low  = jobs.reduce((s, j) => s + j.low, 0);
  const high = jobs.reduce((s, j) => s + j.high, 0);

  assumptions.push(`Paint ${paintLabel}/gallon · 2-coat repaint`);
  assumptions.push("Ballpark only — final price set after on-site visit");

  return { low, high, assumptions, jobs };
}

// ─── Paint visualizer ──────────────────────────────────────────────────────────

const COLOR_PRESETS = [
  { name: "Warm White",    hex: "#F5F0E8" },
  { name: "Light Gray",   hex: "#C8C8C8" },
  { name: "Charcoal",     hex: "#4A4A4A" },
  { name: "Beige",        hex: "#D4C5A9" },
  { name: "Sage Green",   hex: "#8FAF8F" },
  { name: "Forest Green", hex: "#2D5A3D" },
  { name: "Navy Blue",    hex: "#1B3A5C" },
  { name: "Slate Blue",   hex: "#6B7FA3" },
  { name: "Terracotta",   hex: "#C4704A" },
  { name: "Black",        hex: "#1A1A1A" },
];

async function compressToFile(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 1024;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error("Canvas toBlob failed")); return; }
        resolve(new File([blob], "photo.jpg", { type: "image/jpeg" }));
      }, "image/jpeg", 0.85);
    };
    img.onerror = reject;
    img.src = url;
  });
}

function PaintVisualizer({ photos }: { photos: File[] }) {
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [uploadedPhoto, setUploadedPhoto] = useState<File | null>(null);
  const [selectedColor, setSelectedColor] = useState<{ name: string; hex: string } | null>(null);
  const [customHex, setCustomHex] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  const activePhoto = selectedPhoto ?? uploadedPhoto;
  const activeColor = customHex.match(/^#[0-9A-Fa-f]{6}$/)
    ? { name: "Custom color", hex: customHex }
    : selectedColor;

  async function generate() {
    if (!activePhoto || !activeColor) return;
    setGenerating(true);
    setError(null);
    setResult(null);
    try {
      const compressedFile = await compressToFile(activePhoto);
      const form = new FormData();
      form.append("image", compressedFile);
      form.append("colorName", activeColor.name);
      form.append("colorHex", activeColor.hex);
      const res = await fetch("/api/visualize", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setResult(data.result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0]">
        <p className="text-sm font-semibold text-[#0F1628]">🎨 See it in a color <span className="text-xs font-normal text-slate-400 ml-1">optional</span></p>
      </div>

      <div className="p-4 space-y-4">
        {/* Photo selection */}
        <div>
          {photos.length > 0 && !uploadedPhoto && (
            <>
              <p className="text-xs text-slate-500 mb-2">Pick a photo</p>
              <div className="flex gap-2 flex-wrap items-center">
                {photos.map((file, i) => {
                  const url = URL.createObjectURL(file);
                  const active = selectedPhoto === file;
                  return (
                    <button
                      key={i}
                      onClick={() => { setSelectedPhoto(file); setResult(null); }}
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${active ? "border-orange-500" : "border-transparent"}`}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" onLoad={() => URL.revokeObjectURL(url)} />
                    </button>
                  );
                })}
                <button
                  onClick={() => uploadRef.current?.click()}
                  className="w-16 h-16 rounded-lg border-2 border-dashed border-[#E2E8F0] flex items-center justify-center text-slate-400 hover:border-orange-300 hover:text-orange-400 transition-colors text-xl"
                  title="Upload a different photo"
                >+</button>
              </div>
            </>
          )}
          {(photos.length === 0 || uploadedPhoto) && (
            <>
              {photos.length > 0 && <p className="text-xs text-slate-500 mb-2">Uploaded photo</p>}
              {!uploadedPhoto && <p className="text-xs text-slate-500 mb-2">Upload a photo of your space</p>}
              {uploadedPhoto ? (
                <div className="relative">
                  <img
                    src={URL.createObjectURL(uploadedPhoto)}
                    alt="Uploaded"
                    className="w-full rounded-xl object-cover max-h-48"
                  />
                  <button
                    onClick={() => { setUploadedPhoto(null); setSelectedPhoto(photos[0] ?? null); setResult(null); }}
                    className="absolute top-2 right-2 bg-black/50 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center hover:bg-black/70"
                  >✕</button>
                </div>
              ) : (
                <button
                  onClick={() => uploadRef.current?.click()}
                  className="w-full border-2 border-dashed border-[#E2E8F0] rounded-xl py-6 text-sm text-slate-400 hover:border-orange-300 hover:text-orange-400 transition-colors"
                >
                  Tap to upload a photo
                </button>
              )}
            </>
          )}
          <input ref={uploadRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) { setUploadedPhoto(f); setSelectedPhoto(null); setResult(null); } }} />
        </div>

        {/* Color swatches */}
        <div>
          <p className="text-xs text-slate-500 mb-2">Pick a wall color</p>
          <div className="grid grid-cols-5 gap-2">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c.hex}
                onClick={() => { setSelectedColor(c); setCustomHex(""); setResult(null); }}
                title={c.name}
                className={`aspect-square rounded-lg border-2 transition-all ${selectedColor?.hex === c.hex && !customHex ? "border-orange-500 scale-110" : "border-transparent hover:scale-105"}`}
                style={{ background: c.hex }}
              />
            ))}
          </div>
          <p className="text-[.7rem] text-slate-400 mt-1.5 text-center">
            {selectedColor && !customHex ? selectedColor.name : ""}
          </p>

          {/* Custom color */}
          <div className="flex items-center gap-2 mt-2">
            <input
              type="color"
              value={customHex || "#ffffff"}
              onChange={(e) => { setCustomHex(e.target.value); setSelectedColor(null); setResult(null); }}
              className="w-8 h-8 rounded cursor-pointer border border-[#E2E8F0]"
            />
            <span className="text-xs text-slate-400">Custom color</span>
            {customHex && <span className="text-xs text-slate-400">{customHex}</span>}
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={generate}
          disabled={!activePhoto || !activeColor || generating}
          className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,#F97316,#FB923C)" }}
        >
          {generating ? "Generating…" : "Generate Preview"}
        </button>

        {generating && (
          <div className="text-center space-y-1.5">
            <div className="flex justify-center gap-1">
              {[0,1,2].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <p className="text-xs text-slate-400">AI is repainting your space — usually takes 30–60 seconds</p>
          </div>
        )}

        {error && <p className="text-xs text-red-500 text-center">{error}</p>}

        {/* Before / after result */}
        {result && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-center">Before / After</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[.7rem] text-slate-400 mb-1 text-center">Before</p>
                <img src={URL.createObjectURL(activePhoto!)} alt="Before" className="w-full rounded-lg object-cover aspect-square" />
              </div>
              <div>
                <p className="text-[.7rem] text-slate-400 mb-1 text-center">After</p>
                <img src={result} alt="After" className="w-full rounded-lg object-cover aspect-square" />
              </div>
            </div>
            <p className="text-[.7rem] text-slate-400 text-center">AI-generated preview — colors may vary from actual paint</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step sequence ─────────────────────────────────────────────────────────────

type StepId =
  | "service" | "rooms" | "size" | "scope" | "interior_condition"
  | "stories" | "exterior_condition"
  | "timeline" | "contact" | "photos" | "processing" | "results";

function getSequence(serviceType: string): StepId[] {
  if (serviceType === "other") return ["service", "contact", "results"];
  const core: StepId[] = ["service"];
  if (serviceType === "interior") core.push("rooms", "size", "scope", "interior_condition");
  if (serviceType === "exterior") core.push("stories", "exterior_condition");
  if (serviceType === "both")     core.push("rooms", "size", "scope", "interior_condition", "stories", "exterior_condition");
  core.push("timeline", "contact");
  return [...core, "photos", "results"];
}

function getQuestionnaireSteps(serviceType: string): StepId[] {
  return getSequence(serviceType).filter((s) => !["photos", "processing", "results"].includes(s));
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step, answers }: { step: StepId; answers: Answers }) {
  const qSteps = getQuestionnaireSteps(answers.serviceType || "interior");
  const idx = qSteps.indexOf(step);
  if (idx === -1) return null;
  const pct = Math.round(((idx + 1) / qSteps.length) * 100);
  return (
    <div className="h-1 bg-[#E2E8F0]">
      <div className="h-full transition-all duration-400" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#F97316,#FB923C)" }} />
    </div>
  );
}

// ─── Tap option ───────────────────────────────────────────────────────────────

function TapOption({ label, sublabel, selected, onClick }: { label: string; sublabel?: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 rounded-xl border-[1.5px] transition-all ${
        selected ? "border-[#F97316] bg-[#FFF7ED]" : "border-[#CBD5E1] bg-white hover:border-[#FDBA74]"
      }`}
    >
      <div className={`font-bold text-[.85rem] ${selected ? "text-[#F97316]" : "text-[#0F1628]"}`} style={{ fontFamily: "var(--font-sora)" }}>
        {label}
      </div>
      {sublabel && <div className="text-[.74rem] text-slate-400 mt-0.5">{sublabel}</div>}
    </button>
  );
}

// ─── Question wrapper ─────────────────────────────────────────────────────────

function QuestionStep({
  stepLabel, title, children, onBack, backLabel = "← Back",
}: {
  stepLabel?: string; title: string; children: React.ReactNode; onBack?: () => void; backLabel?: string;
}) {
  return (
    <div className="space-y-5">
      <div>
        {stepLabel && <p className="text-[.72rem] font-bold text-slate-400 uppercase tracking-[.1em] mb-1">{stepLabel}</p>}
        <h2 className="text-[1.1rem] font-bold text-[#0F1628]" style={{ fontFamily: "var(--font-sora)" }}>{title}</h2>
      </div>
      <div className="space-y-2.5">{children}</div>
      {onBack && (
        <button onClick={onBack} className="text-[.82rem] text-slate-400 hover:text-slate-600 transition-colors">
          {backLabel}
        </button>
      )}
    </div>
  );
}

// ─── Processing spinner ───────────────────────────────────────────────────────

const SPINNER_MESSAGES = [
  "Analyzing your project...",
  "Measuring estimated square footage...",
  "Running pricing calculations...",
  "Checking local labor rates...",
  "Putting together your estimate...",
];

function StepProcessing() {
  const [msgIdx, setMsgIdx] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setMsgIdx((i) => (i + 1) % SPINNER_MESSAGES.length), 2200);
    return () => clearInterval(iv);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-6 text-center">
      <div className="w-12 h-12 rounded-full animate-spin" style={{ border: "3px solid #e5e7eb", borderTopColor: "#f97316" }} />
      <div>
        <p className="text-[#0F1628] font-semibold" style={{ fontFamily: "var(--font-sora)" }}>{SPINNER_MESSAGES[msgIdx]}</p>
        <p className="text-slate-400 text-sm mt-1">This takes about 10–20 seconds</p>
      </div>
    </div>
  );
}

// ─── Results ──────────────────────────────────────────────────────────────────

function StepResults({ estimate, company, photos }: { estimate: EstimateResult; company: Company; photos: File[] }) {
  return (
    <div className="space-y-5">
      <div className="text-center">
        <p className="text-[.72rem] font-bold text-slate-400 uppercase tracking-[.1em] mb-2">
          Your estimate
        </p>
        <p className="text-[2.4rem] font-extrabold tracking-tight text-[#0F1628] leading-none" style={{ fontFamily: "var(--font-sora)" }}>
          {fmt(estimate.low)} – {fmt(estimate.high)}
        </p>
      </div>

      {estimate.jobs.length > 1 && (
        <div className="space-y-2">
          <p className="text-[.8rem] font-semibold text-[#0F1628]">Breakdown</p>
          {estimate.jobs.map((job, i) => (
            <div key={i} className="flex justify-between items-center bg-[#F8FAFC] rounded-xl px-4 py-3 border border-[#E2E8F0] text-sm">
              <span className="text-slate-600">{job.name}</span>
              <span className="font-semibold text-[#0F1628]">{fmt(job.low)} – {fmt(job.high)}</span>
            </div>
          ))}
        </div>
      )}

      {estimate.assumptions.length > 0 && (
        <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-4 py-3">
          <p className="text-[.72rem] font-bold text-blue-700 uppercase tracking-[.08em] mb-1.5">Based on</p>
          <ul className="space-y-0.5">
            {estimate.assumptions.map((a, i) => <li key={i} className="text-xs text-blue-700">• {a}</li>)}
          </ul>
        </div>
      )}

      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white shrink-0 text-sm" style={{ background: "linear-gradient(135deg,#F97316,#FB923C)", fontFamily: "var(--font-sora)" }}>P</div>
        <div>
          <p className="text-[.88rem] font-bold text-[#0F1628]" style={{ fontFamily: "var(--font-sora)" }}>{company.businessName}</p>
          {company.serviceArea && <p className="text-xs text-slate-400">{company.serviceArea}</p>}
        </div>
      </div>

      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-center">
        <p className="text-sm text-slate-600">
          Your request has been received. We&apos;ll reach out within 24 hours to schedule a free on-site quote.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-center">
        <p className="text-xs text-amber-700 font-medium">
          This is a preliminary ballpark estimate only. Your final price will be determined after an in-person assessment by the painter.
        </p>
      </div>

      <PaintVisualizer photos={photos} />
    </div>
  );
}

function OtherResults({ company }: { company: Company }) {
  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl" style={{ background: "linear-gradient(135deg,#FFF7ED,#FDBA74)" }}>
          📋
        </div>
        <h2 className="text-[1.1rem] font-bold text-[#0F1628]" style={{ fontFamily: "var(--font-sora)" }}>
          Request received
        </h2>
        <p className="text-sm text-slate-500 mt-1.5">
          Your project sounds like it needs a custom quote. We&apos;ll reach out to discuss the details.
        </p>
      </div>

      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white shrink-0 text-sm" style={{ background: "linear-gradient(135deg,#F97316,#FB923C)", fontFamily: "var(--font-sora)" }}>P</div>
        <div>
          <p className="text-[.88rem] font-bold text-[#0F1628]" style={{ fontFamily: "var(--font-sora)" }}>{company.businessName}</p>
          {company.serviceArea && <p className="text-xs text-slate-400">{company.serviceArea}</p>}
        </div>
      </div>

      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-center">
        <p className="text-sm text-slate-600">
          We&apos;ll reach out within 24 hours to schedule a free on-site quote.
        </p>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function QuotePage() {
  const params = useParams();
  const companyId = params.companyId as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [companyError, setCompanyError] = useState(false);

  const [step, setStep] = useState<StepId>("service");
  const [answers, setAnswers] = useState<Answers>({
    serviceType: "", rooms: "", homeSize: "", scope: "", interiorCondition: "",
    stories: "", exteriorCondition: "", exteriorSize: "", timeline: "",
  });
  const [contact, setContact] = useState<Contact>({ name: "", phone: "", email: "", address: "", smsConsent: false });
  const [contactErrors, setContactErrors] = useState<ContactErrors>({});
  const [savingContact, setSavingContact] = useState(false);

  const [leadId, setLeadId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [estimate, setEstimate] = useState<EstimateResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/leads/public/company/${companyId}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setCompany)
      .catch(() => setCompanyError(true));
  }, [companyId]);

  // ─── Navigation ─────────────────────────────────────────────────────────────

  function answer<K extends keyof Answers>(key: K, value: Answers[K]) {
    const next = { ...answers, [key]: value };
    setAnswers(next);
    const seq = getSequence(next.serviceType || "interior");
    const idx = seq.indexOf(step);
    const nextStep = seq[idx + 1];
    if (nextStep) setStep(nextStep);
  }

  function goBack() {
    const seq = getSequence(answers.serviceType || "interior");
    const idx = seq.indexOf(step);
    if (idx > 0) setStep(seq[idx - 1]);
  }

  // ─── Contact submit ──────────────────────────────────────────────────────────

  async function handleContactNext() {
    const errors: ContactErrors = {};
    if (!contact.name.trim()) errors.name = "Name is required";
    const phoneResult = validateAndNormalizePhone(contact.phone);
    if (!phoneResult.isValid) errors.phone = phoneResult.error;
    if (!contact.email.trim()) {
      errors.email = "Email is required";
    } else {
      const emailResult = validateAndNormalizeEmail(contact.email);
      if (!emailResult.isValid) errors.email = emailResult.error;
    }
    if (Object.keys(errors).length > 0) { setContactErrors(errors); return; }
    setContactErrors({});
    setSavingContact(true);

    try {
      const res = await fetch("/api/leads/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          contact: { name: contact.name, phone: contact.phone, email: contact.email, address: contact.address || undefined },
          smsConsent: contact.smsConsent,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setLeadId(data.leadId);

        // For "other", save and finalize immediately
        if (answers.serviceType === "other") {
          fetch(`/api/leads/public/${data.leadId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ serviceType: "other", description: "Other/custom project", finalize: true }),
          }).catch(() => {});
        }
      }
    } catch { /* silent */ }

    setSavingContact(false);

    if (answers.serviceType === "other") {
      setStep("results");
    } else {
      setStep("photos");
    }
  }

  // ─── Skip photos → instant estimate ─────────────────────────────────────────

  async function handleSkip() {
    const instant = buildInstantEstimate(answers, company?.laborRate ?? null, company?.paintTier ?? "standard");
    setEstimate(instant);

    if (leadId && instant) {
      const desc = buildDescription(answers);
      fetch(`/api/leads/public/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceType: answers.serviceType,
          description: desc,
          timeline: answers.timeline,
          estimateLow: instant.low,
          estimateHigh: instant.high,
          estimateConfidence: "medium",
          estimateAssumptions: instant.assumptions,
          finalize: true,
        }),
      }).catch(() => {});
    }

    setStep("results");
  }

  // ─── Upload photos → AI summary (estimate stays client-side) ─────────────────

  async function handleUploadAndEstimate() {
    if (photos.length === 0) return;
    setSubmitting(true);
    setSubmitError(null);
    setStep("processing");

    const instant = buildInstantEstimate(answers, company?.laborRate ?? null, company?.paintTier ?? "standard");

    const lid = leadId;
    if (lid && instant) {
      (async () => {
        try {
          const photoUrls = await Promise.all(
            photos.map((file) => uploadLeadPhoto(file, lid))
          );
          const desc = buildDescription(answers);
          await fetch(`/api/leads/public/${lid}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              serviceType: answers.serviceType,
              description: desc,
              timeline: answers.timeline,
              photoUrls,
              estimateLow: instant.low,
              estimateHigh: instant.high,
              estimateConfidence: "medium",
              estimateAssumptions: instant.assumptions,
              generateSummary: true,
            }),
          });
        } catch (err) {
          console.error("Photo upload failed:", err);
        }
      })();
    }

    setEstimate(instant);
    setSubmitting(false);
    setStep("results");
  }

  // ─── Build description from questionnaire ────────────────────────────────────

  function buildDescription(a: Answers): string {
    const parts: string[] = [];
    if (a.serviceType === "interior" || a.serviceType === "both") {
      const scope = SCOPE_LABELS[a.scope] ?? a.scope;
      const cond = INTERIOR_CONDITION_LABELS[a.interiorCondition] ?? a.interiorCondition;
      parts.push(`Interior painting: ${a.rooms} room(s), ${a.homeSize} home, ${scope}, ${cond}`);
    }
    if (a.serviceType === "exterior" || a.serviceType === "both") {
      const cond = EXTERIOR_CONDITION_LABELS[a.exteriorCondition] ?? a.exteriorCondition;
      parts.push(`Exterior painting: ${a.stories}-story home, ${cond}`);
    }
    if (a.serviceType === "other") {
      parts.push("Other/custom project");
    }
    if (a.timeline) parts.push(`Timeline: ${a.timeline}`);
    return parts.join(". ");
  }

  // ─── Loading / error states ──────────────────────────────────────────────────

  if (companyError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-slate-500 text-sm">This quote link is no longer active.</p>
      </div>
    );
  }

  if (company && !company.subscriptionActive) {
    return (
      <div className="min-h-screen flex items-start justify-center p-4 pt-8" style={{ background: "linear-gradient(180deg,#F8FAFC 0%,white 100%)" }}>
        <div className="w-full max-w-[480px] bg-white border border-[#E2E8F0] rounded-[18px] overflow-hidden" style={{ boxShadow: "0 4px 6px rgba(0,0,0,.04),0 10px 28px rgba(0,0,0,.08)" }}>
          <div className="px-6 py-5 flex items-center gap-3" style={{ background: "linear-gradient(135deg,#0F1628,#1E2A45)" }}>
            {company.logoUrl ? (
              <img src={company.logoUrl} alt={company.businessName} className="w-9 h-9 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white shrink-0" style={{ background: "linear-gradient(135deg,#F97316,#FB923C)", fontFamily: "var(--font-sora)", fontSize: ".9rem" }}>
                {company.businessName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-[.95rem] font-bold text-white" style={{ fontFamily: "var(--font-sora)" }}>{company.businessName}</p>
              <p className="text-[.75rem] text-white/50 mt-0.5">Free estimate</p>
            </div>
          </div>
          <div className="px-6 py-10 text-center space-y-3">
            <p className="font-semibold text-[#0F1628]">Quote form temporarily unavailable</p>
            <p className="text-sm text-slate-500">{company.businessName} is not currently accepting online quote requests. Please contact them directly.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 rounded-full animate-spin" style={{ border: "2px solid #e5e7eb", borderTopColor: "#f97316" }} />
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex items-start justify-center p-4 pt-8" style={{ background: "linear-gradient(180deg,#F8FAFC 0%,white 100%)" }}>
      <div className="w-full max-w-[480px] bg-white border border-[#E2E8F0] rounded-[18px] overflow-hidden" style={{ boxShadow: "0 4px 6px rgba(0,0,0,.04),0 10px 28px rgba(0,0,0,.08)" }}>

        {/* Brand header */}
        <div className="px-6 py-5 flex items-center gap-3" style={{ background: "linear-gradient(135deg,#0F1628,#1E2A45)" }}>
          {company.logoUrl ? (
            <img src={company.logoUrl} alt={company.businessName} className="w-9 h-9 rounded-lg object-cover shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white shrink-0" style={{ background: "linear-gradient(135deg,#F97316,#FB923C)", fontFamily: "var(--font-sora)", fontSize: ".9rem" }}>
              {company.businessName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-[.95rem] font-bold text-white" style={{ fontFamily: "var(--font-sora)" }}>{company.businessName}</p>
            <p className="text-[.75rem] text-white/50 mt-0.5">Free estimate</p>
          </div>
        </div>

        {/* Progress bar (questionnaire steps only) */}
        <ProgressBar step={step} answers={answers} />

        {/* Body */}
        <div className="px-6 py-7">

          {submitError && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
              {submitError}
            </div>
          )}

          {/* ── Step: service type ── */}
          {step === "service" && (
            <QuestionStep title="What needs painting?">
              <TapOption label="Interior" sublabel="Rooms, walls, ceilings, trim" selected={answers.serviceType === "interior"} onClick={() => answer("serviceType", "interior")} />
              <TapOption label="Exterior" sublabel="Siding, trim, doors, fences" selected={answers.serviceType === "exterior"} onClick={() => answer("serviceType", "exterior")} />
              <TapOption label="Both" sublabel="Full house repaint" selected={answers.serviceType === "both"} onClick={() => answer("serviceType", "both")} />
              <TapOption label="Other" sublabel="Deck, garage, commercial, etc." selected={answers.serviceType === "other"} onClick={() => answer("serviceType", "other")} />
            </QuestionStep>
          )}

          {/* ── Step: rooms ── */}
          {step === "rooms" && (
            <QuestionStep title="How many rooms?" onBack={goBack}>
              <TapOption label="1–2 rooms" sublabel="Bedroom, bathroom, office" selected={answers.rooms === "1-2"} onClick={() => answer("rooms", "1-2")} />
              <TapOption label="3–4 rooms" sublabel="Living room, kitchen + a few more" selected={answers.rooms === "3-4"} onClick={() => answer("rooms", "3-4")} />
              <TapOption label="5+ rooms" sublabel="Most or all of the home" selected={answers.rooms === "5+"} onClick={() => answer("rooms", "5+")} />
            </QuestionStep>
          )}

          {/* ── Step: home size ── */}
          {step === "size" && (
            <QuestionStep title="Roughly how big is your home?" onBack={goBack}>
              <TapOption label="Small" sublabel="Apartment, condo, or small house" selected={answers.homeSize === "small"} onClick={() => answer("homeSize", "small")} />
              <TapOption label="Medium" sublabel="Typical 2–3 bedroom home" selected={answers.homeSize === "medium"} onClick={() => answer("homeSize", "medium")} />
              <TapOption label="Large" sublabel="4+ bedrooms or an oversized space" selected={answers.homeSize === "large"} onClick={() => answer("homeSize", "large")} />
              <TapOption label="Not sure" sublabel="We'll estimate for a medium home" selected={false} onClick={() => answer("homeSize", "medium")} />
            </QuestionStep>
          )}

          {/* ── Step: scope ── */}
          {step === "scope" && (
            <QuestionStep title="What are we painting?" onBack={goBack}>
              <TapOption label="Walls only" sublabel="Standard repaint — walls get 2 coats" selected={answers.scope === "walls_only"} onClick={() => answer("scope", "walls_only")} />
              <TapOption label="Walls + ceilings" sublabel="Walls and all ceilings" selected={answers.scope === "walls_ceilings"} onClick={() => answer("scope", "walls_ceilings")} />
              <TapOption label="Walls, ceilings, trim & doors" sublabel="Full room repaint including trim" selected={answers.scope === "walls_ceilings_trim_doors"} onClick={() => answer("scope", "walls_ceilings_trim_doors")} />
              <TapOption label="Not sure / other" sublabel="We'll estimate for walls + ceilings" selected={false} onClick={() => answer("scope", "walls_ceilings")} />
            </QuestionStep>
          )}

          {/* ── Step: interior condition ── */}
          {step === "interior_condition" && (
            <QuestionStep title="How are the walls and surfaces?" onBack={goBack}>
              <TapOption label="Good" sublabel="Clean, smooth — ready to paint" selected={answers.interiorCondition === "good"} onClick={() => answer("interiorCondition", "good")} />
              <TapOption label="Some prep needed" sublabel="Minor holes, scuffs, or stains to fix" selected={answers.interiorCondition === "some_prep"} onClick={() => answer("interiorCondition", "some_prep")} />
              <TapOption label="Significant prep needed" sublabel="Heavy damage, peeling, or mold" selected={answers.interiorCondition === "significant_prep"} onClick={() => answer("interiorCondition", "significant_prep")} />
              <TapOption label="Not sure" sublabel="We'll estimate for light prep" selected={false} onClick={() => answer("interiorCondition", "some_prep")} />
            </QuestionStep>
          )}

          {/* ── Step: stories ── */}
          {step === "stories" && (
            <QuestionStep title="How many stories?" onBack={goBack}>
              <TapOption label="1 story" selected={answers.stories === "1"} onClick={() => answer("stories", "1")} />
              <TapOption label="2 stories" selected={answers.stories === "2"} onClick={() => answer("stories", "2")} />
              <TapOption label="3+ stories" selected={answers.stories === "3+"} onClick={() => answer("stories", "3+")} />
            </QuestionStep>
          )}

          {/* ── Step: exterior condition ── */}
          {step === "exterior_condition" && (
            <QuestionStep title="How's the exterior condition?" onBack={goBack}>
              <TapOption label="Good" sublabel="Clean, no major peeling or damage" selected={answers.exteriorCondition === "good"} onClick={() => answer("exteriorCondition", "good")} />
              <TapOption label="Fair" sublabel="Some peeling, fading, or minor repairs" selected={answers.exteriorCondition === "fair"} onClick={() => answer("exteriorCondition", "fair")} />
              <TapOption label="Needs work" sublabel="Significant peeling, rot, or damage" selected={answers.exteriorCondition === "poor"} onClick={() => answer("exteriorCondition", "poor")} />
              <TapOption label="Not sure" sublabel="We'll estimate for fair condition" selected={false} onClick={() => answer("exteriorCondition", "fair")} />
            </QuestionStep>
          )}

          {/* ── Step: timeline ── */}
          {step === "timeline" && (
            <QuestionStep title="When do you need it done?" onBack={goBack}>
              {[
                { value: "asap",           label: "ASAP",                sublabel: "As soon as possible" },
                { value: "within_2_weeks", label: "Within 2 weeks",      sublabel: undefined },
                { value: "within_month",   label: "Within a month",      sublabel: undefined },
                { value: "flexible",       label: "Flexible",            sublabel: "Just exploring options" },
              ].map((opt) => (
                <TapOption key={opt.value} label={opt.label} sublabel={opt.sublabel} selected={answers.timeline === opt.value} onClick={() => answer("timeline", opt.value)} />
              ))}
            </QuestionStep>
          )}

          {/* ── Step: contact ── */}
          {step === "contact" && (
            <div className="space-y-5">
              <div>
                <p className="text-[.72rem] font-bold text-slate-400 uppercase tracking-[.1em] mb-1">Almost there</p>
                <h2 className="text-[1.1rem] font-bold text-[#0F1628]" style={{ fontFamily: "var(--font-sora)" }}>Your contact info</h2>
                <p className="text-sm text-slate-500 mt-1">
                  {answers.serviceType === "other"
                    ? "We'll reach out to discuss your project."
                    : "We'll send your estimate and have the painter follow up."}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[.8rem] font-semibold text-[#0F1628] mb-1.5">Full name</label>
                  <input type="text" value={contact.name} onChange={(e) => setContact((p) => ({ ...p, name: e.target.value }))} placeholder="Jane Smith"
                    className={`w-full border-[1.5px] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#F97316] focus:shadow-[0_0_0_3px_rgba(249,115,22,.1)] bg-white text-[#1E293B] placeholder:text-slate-400 ${contactErrors.name ? "border-red-400" : "border-[#CBD5E1]"}`} />
                  {contactErrors.name && <p className="mt-1 text-xs text-red-500">{contactErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-[.8rem] font-semibold text-[#0F1628] mb-1.5">Phone number</label>
                  <input type="tel" value={contact.phone} onChange={(e) => setContact((p) => ({ ...p, phone: e.target.value }))} placeholder="(512) 555-0100"
                    className={`w-full border-[1.5px] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#F97316] focus:shadow-[0_0_0_3px_rgba(249,115,22,.1)] bg-white text-[#1E293B] placeholder:text-slate-400 ${contactErrors.phone ? "border-red-400" : "border-[#CBD5E1]"}`} />
                  {contactErrors.phone && <p className="mt-1 text-xs text-red-500">{contactErrors.phone}</p>}
                </div>

                <div>
                  <label className="block text-[.8rem] font-semibold text-[#0F1628] mb-1.5">Email</label>
                  <input type="email" value={contact.email} onChange={(e) => setContact((p) => ({ ...p, email: e.target.value }))} placeholder="jane@example.com"
                    className={`w-full border-[1.5px] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#F97316] focus:shadow-[0_0_0_3px_rgba(249,115,22,.1)] bg-white text-[#1E293B] placeholder:text-slate-400 ${contactErrors.email ? "border-red-400" : "border-[#CBD5E1]"}`} />
                  {contactErrors.email && <p className="mt-1 text-xs text-red-500">{contactErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-[.8rem] font-semibold text-[#0F1628] mb-1.5">
                    Property address <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input type="text" value={contact.address} onChange={(e) => setContact((p) => ({ ...p, address: e.target.value }))} placeholder="123 Main St, Austin TX"
                    className="w-full border-[1.5px] border-[#CBD5E1] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#F97316] focus:shadow-[0_0_0_3px_rgba(249,115,22,.1)] bg-white text-[#1E293B] placeholder:text-slate-400" />
                </div>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={contact.smsConsent}
                  onChange={(e) => { setContact((p) => ({ ...p, smsConsent: e.target.checked })); setContactErrors((p) => ({ ...p, smsConsent: undefined })); }}
                  className="mt-0.5 h-4 w-4 rounded border-[#CBD5E1] text-[#F97316] focus:ring-[#F97316] shrink-0"
                />
                <span className="text-xs text-slate-500 leading-relaxed">
                  Get updates by text too? Message &amp; data rates may apply. Reply STOP to opt out.{" "}
                  <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-700">Privacy Policy</a>
                </span>
              </label>
              <button onClick={handleContactNext} disabled={savingContact}
                className="w-full bg-[#F97316] hover:bg-orange-600 text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60">
                {savingContact ? "Saving..." : answers.serviceType === "other" ? "Submit request →" : "See my estimate →"}
              </button>

              <button onClick={goBack} className="w-full text-[.82rem] text-slate-400 hover:text-slate-600 transition-colors">
                ← Back
              </button>
            </div>
          )}

          {/* ── Step: photos (optional) ── */}
          {step === "photos" && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl" style={{ background: "linear-gradient(135deg,#FFF7ED,#FDBA74)" }}>
                  📸
                </div>
                <div className="flex items-center justify-center gap-2">
                  <h2 className="text-[1.1rem] font-bold text-[#0F1628]" style={{ fontFamily: "var(--font-sora)" }}>
                    Add photos (optional)
                  </h2>
                  {photos.length > 0 && (
                    <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      {photos.length}/5
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-1.5">
                  Photos help the painter understand your project before they call.
                  {answers.serviceType === "exterior" && " Exterior shots work best."}
                </p>
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={(e) => {
                const incoming = Array.from(e.target.files ?? []);
                setPhotos((prev) => {
                  const combined = [...prev, ...incoming];
                  return combined.slice(0, 5);
                });
                e.target.value = "";
              }} className="hidden" />

              {photos.length === 0 ? (
                <button onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-[#CBD5E1] rounded-xl py-8 text-sm text-slate-400 hover:border-[#FDBA74] hover:text-slate-600 transition-colors">
                  + Add photos
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {photos.map((f, i) => (
                      <div key={i} className="relative">
                        <img
                          src={URL.createObjectURL(f)}
                          alt={f.name}
                          className="w-20 h-20 object-cover rounded-xl border border-[#E2E8F0]"
                        />
                        <button
                          onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white border border-[#E2E8F0] rounded-full text-slate-400 hover:text-red-500 flex items-center justify-center text-xs shadow-sm"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {photos.length < 5 && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-20 h-20 border-2 border-dashed border-[#CBD5E1] rounded-xl text-slate-400 hover:border-[#FDBA74] hover:text-slate-600 transition-colors flex flex-col items-center justify-center gap-1"
                      >
                        <span className="text-lg">+</span>
                        <span className="text-[10px]">{5 - photos.length} left</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {photos.length > 0 && (
                <button onClick={handleUploadAndEstimate} disabled={submitting}
                  className="w-full bg-[#F97316] hover:bg-orange-600 text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60">
                  {submitting ? "Uploading..." : "Submit with photos →"}
                </button>
              )}

              <button onClick={handleSkip} className="w-full text-sm text-slate-500 hover:text-slate-700 py-2 transition-colors">
                Skip — show my estimate now
              </button>
            </div>
          )}

          {/* ── Step: processing ── */}
          {step === "processing" && <StepProcessing />}

          {/* ── Step: results ── */}
          {step === "results" && (
            answers.serviceType === "other" ? (
              <OtherResults company={company} />
            ) : estimate ? (
              <StepResults estimate={estimate} company={company} photos={photos} />
            ) : null
          )}

        </div>
      </div>
    </div>
  );
}
