"use client";

import { useEffect, useState } from "react";
import type { Business } from "@/lib/db/schema/businesses";
import type { PricingRule, PricingType } from "@/lib/db/schema/pricingRules";
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  FormGroup,
  Field,
  Select,
  TextArea,
  Button,
  Toggle,
  Icon,
  Badge,
} from "@/components/dashboard/v2/primitives";

const TABS = [
  { key: "call", label: "Call setup", icon: "phone_in_talk" },
  { key: "pricing", label: "Services & pricing", icon: "sell" },
  { key: "notifications", label: "Notifications", icon: "notifications" },
  { key: "team", label: "Team", icon: "group" },
  { key: "integrations", label: "Integrations", icon: "extension" },
  { key: "billing", label: "Billing", icon: "credit_card" },
  { key: "business", label: "Business profile", icon: "business" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function useSave() {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function save(data: Record<string, unknown>) {
    setLoading(true);
    setSaved(false);
    setError("");
    try {
      const res = await fetch("/api/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to save.");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return { loading, saved, error, save };
}

interface Props {
  business: Business;
  pricingRules: PricingRule[];
  serviceOptions: { value: string; label: string }[];
  initialTab?: string;
}

export function SettingsTabs({ business, pricingRules, serviceOptions, initialTab }: Props) {
  const [tab, setTab] = useState<TabKey>((TABS.some((t) => t.key === initialTab) ? initialTab : "call") as TabKey);

  return (
    <section className="grid grid-cols-1 md:grid-cols-[205px_minmax(0,1fr)] gap-4 items-start">
      <Card className="p-2 flex md:flex-col gap-0.5 overflow-x-auto md:overflow-visible md:sticky md:top-[86px]">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-left text-xs font-bold whitespace-nowrap transition-colors ${
              tab === t.key ? "bg-cv-primary-soft text-cv-primary-dark" : "text-cv-muted hover:bg-cv-surface-subtle hover:text-cv-ink"
            }`}
          >
            <Icon name={t.icon} className="!text-lg" />
            {t.label}
          </button>
        ))}
      </Card>

      <div>
        {tab === "call" && <CallSetupPanel business={business} />}
        {tab === "pricing" && <PricingPanel businessId={business.id} vertical={business.vertical} initialRules={pricingRules} serviceOptions={serviceOptions} />}
        {tab === "notifications" && <NotificationsPanel business={business} />}
        {tab === "team" && <TeamPanel business={business} />}
        {tab === "integrations" && <IntegrationsPanel />}
        {tab === "billing" && <BillingPanel />}
        {tab === "business" && <BusinessProfilePanel business={business} />}
      </div>
    </section>
  );
}

// ─── Call setup ─────────────────────────────────────────────────────────────

const RING_TIMES = [15, 20, 25, 30];
const VOICES = [
  { value: "alloy", label: "Alloy — neutral and balanced" },
  { value: "ash", label: "Ash — clear and precise" },
  { value: "coral", label: "Coral — warm and friendly" },
  { value: "marin", label: "Marin — recommended, highest quality" },
];

function CallSetupPanel({ business }: { business: Business }) {
  const [forwardingNumber, setForwardingNumber] = useState(business.forwardingNumber ?? "");
  const [callTimeoutSeconds, setCallTimeoutSeconds] = useState(business.callTimeoutSeconds);
  const [overflowMode, setOverflowMode] = useState(business.overflowMode);
  const routing = useSave();

  const [greetingMessage, setGreetingMessage] = useState(business.greetingMessage ?? "");
  const [voiceName, setVoiceName] = useState(business.voiceName);
  const [urgentTransferNumber, setUrgentTransferNumber] = useState(business.urgentTransferNumber ?? "");
  const [aiInstructions, setAiInstructions] = useState(business.aiInstructions ?? "");
  const [recordingEnabled, setRecordingEnabled] = useState(business.recordingEnabled);
  const [recordingDisclosure, setRecordingDisclosure] = useState(business.recordingDisclosure ?? "");
  const experience = useSave();

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="!text-base">Call routing</CardTitle>
            <p className="text-[11px] text-cv-muted mt-1">Your team gets the first chance to answer. Callverted steps in only when needed.</p>
          </div>
          <Badge color={business.twilioPhoneNumber ? "green" : "gray"}>{business.twilioPhoneNumber ? "Live" : "Not provisioned"}</Badge>
        </CardHeader>
        <CardBody className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-3 p-4 bg-cv-surface-subtle border border-cv-border rounded-xl">
            <div className="text-center">
              <div className="w-[46px] h-[46px] rounded-full grid place-items-center mx-auto mb-2 bg-white border border-cv-border-strong text-cv-primary">
                <Icon name="person" />
              </div>
              <strong className="block text-[11px]">Customer calls</strong>
              <span className="block text-cv-muted text-[9px] mt-0.5">{business.twilioPhoneNumber ?? "your Callverted number"}</span>
            </div>
            <div className="text-center">
              <div className="w-[46px] h-[46px] rounded-full grid place-items-center mx-auto mb-2 bg-white border border-cv-border-strong text-cv-primary">
                <Icon name="storefront" />
              </div>
              <strong className="block text-[11px]">Your business rings</strong>
              <span className="block text-cv-muted text-[9px] mt-0.5">For {callTimeoutSeconds} seconds</span>
            </div>
            <div className="text-center">
              <div className="w-[46px] h-[46px] rounded-full grid place-items-center mx-auto mb-2 bg-cv-primary text-white">
                <Icon name="support_agent" />
              </div>
              <strong className="block text-[11px]">Callverted captures</strong>
              <span className="block text-cv-muted text-[9px] mt-0.5">Only if unanswered</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormGroup label="Your Callverted number" help="Email setup@callverted.com to request one.">
              <Field className="font-cv-mono" value={business.twilioPhoneNumber ?? "Not yet provisioned"} readOnly />
            </FormGroup>
            <FormGroup label="Forward calls to" help="Your office, cell phone, or existing business line.">
              <Field className="font-cv-mono" value={forwardingNumber} onChange={(e) => setForwardingNumber(e.target.value)} placeholder="+1 (555) 000-0000" />
            </FormGroup>
            <FormGroup label="Ring time" help="Approximately 4–5 rings before Callverted answers.">
              <Select value={callTimeoutSeconds} onChange={(e) => setCallTimeoutSeconds(Number(e.target.value))}>
                {RING_TIMES.map((s) => (
                  <option key={s} value={s}>
                    {s} seconds{s === 20 ? " — recommended" : ""}
                  </option>
                ))}
              </Select>
            </FormGroup>
            <FormGroup label="Overflow mode">
              <Select value={overflowMode} onChange={(e) => setOverflowMode(e.target.value as Business["overflowMode"])}>
                <option value="ring_then_ai">Ring team first, then Callverted</option>
                <option value="ai_immediate">Callverted answers immediately</option>
              </Select>
            </FormGroup>
          </div>

          {routing.error && <p className="text-sm text-cv-red">{routing.error}</p>}
          <Button
            variant="primary"
            className="self-end"
            disabled={routing.loading}
            onClick={() => routing.save({ forwardingNumber: forwardingNumber || null, callTimeoutSeconds, overflowMode })}
          >
            {routing.loading ? "Saving…" : routing.saved ? "Saved ✓" : "Save call setup"}
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle className="!text-base">Caller experience</CardTitle>
            <p className="text-[11px] text-cv-muted mt-1">Short, transparent, and structured — not an open-ended receptionist.</p>
          </div>
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormGroup label="Greeting (optional)" help="What the AI says when it answers. Leave blank for the default.">
              <TextArea value={greetingMessage} onChange={(e) => setGreetingMessage(e.target.value)} placeholder={`Thanks for calling ${business.businessName}...`} />
            </FormGroup>
            <FormGroup label="Voice" help="Prompts stay fixed and approved — the voice just reads them naturally.">
              <Select value={voiceName} onChange={(e) => setVoiceName(e.target.value)}>
                {VOICES.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
              </Select>
            </FormGroup>
          </div>
          <FormGroup label="Urgent transfer number (optional)" help="If set, the AI can offer to transfer emergency calls here live.">
            <Field className="font-cv-mono" value={urgentTransferNumber} onChange={(e) => setUrgentTransferNumber(e.target.value)} placeholder="+1 (555) 000-0000" />
          </FormGroup>
          <FormGroup label="Extra instructions for the AI (optional)">
            <TextArea value={aiInstructions} onChange={(e) => setAiInstructions(e.target.value)} placeholder="Any business-specific notes the AI should know when answering calls." />
          </FormGroup>

          <div className="flex justify-between items-center py-3.5 border-t border-cv-border">
            <div>
              <strong className="block text-xs">Record overflow calls</strong>
              <span className="block text-cv-muted text-[10px] mt-1">Plays the disclosure below before recording begins.</span>
            </div>
            <Toggle checked={recordingEnabled} onChange={setRecordingEnabled} />
          </div>
          {recordingEnabled && (
            <FormGroup label="Recording disclosure" help="Spoken by the AI at the start of the call. Confirm required wording with counsel for your state.">
              <Field value={recordingDisclosure} onChange={(e) => setRecordingDisclosure(e.target.value)} placeholder="This call may be recorded to help the team respond." />
            </FormGroup>
          )}

          {experience.error && <p className="text-sm text-cv-red">{experience.error}</p>}
          <Button
            variant="primary"
            className="self-end"
            disabled={experience.loading}
            onClick={() =>
              experience.save({
                greetingMessage: greetingMessage || null,
                voiceName,
                urgentTransferNumber: urgentTransferNumber || null,
                aiInstructions: aiInstructions || null,
                recordingEnabled,
                recordingDisclosure: recordingDisclosure || null,
              })
            }
          >
            {experience.loading ? "Saving…" : experience.saved ? "Saved ✓" : "Save caller experience"}
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}

// ─── Services & pricing ─────────────────────────────────────────────────────

const PRICING_TYPES: { value: PricingType; label: string }[] = [
  { value: "preliminary_range", label: "Range" },
  { value: "fixed", label: "Fixed" },
  { value: "starting", label: "Starting at" },
  { value: "inspection_required", label: "Inspection required" },
];

function centsToDollarsStr(cents: number | null) {
  return cents != null ? String(cents / 100) : "";
}

function PricingPanel({
  businessId,
  vertical,
  initialRules,
  serviceOptions,
}: {
  businessId: string;
  vertical: string;
  initialRules: PricingRule[];
  serviceOptions: { value: string; label: string }[];
}) {
  const [rules, setRules] = useState(initialRules);
  const [savingId, setSavingId] = useState<string | null>(null);

  function addRule() {
    const draft: PricingRule = {
      id: `draft-${Date.now()}`,
      businessId,
      vertical,
      serviceCategory: serviceOptions[0]?.value ?? "",
      pricingType: "preliminary_range",
      minimumAmount: null,
      maximumAmount: null,
      fixedAmount: null,
      startingAmount: null,
      approvedCustomerMessage: "",
      disclaimer: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setRules((r) => [...r, draft]);
  }

  function update(id: string, patch: Partial<PricingRule>) {
    setRules((r) => r.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)));
  }

  async function saveRule(rule: PricingRule) {
    setSavingId(rule.id);
    try {
      const payload = {
        serviceCategory: rule.serviceCategory,
        pricingType: rule.pricingType,
        minimumAmount: rule.minimumAmount,
        maximumAmount: rule.maximumAmount,
        fixedAmount: rule.fixedAmount,
        startingAmount: rule.startingAmount,
        approvedCustomerMessage: rule.approvedCustomerMessage,
        disclaimer: rule.disclaimer,
        isActive: rule.isActive,
      };
      if (rule.id.startsWith("draft-")) {
        const res = await fetch("/api/pricing-rules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, vertical }),
        });
        const created = await res.json();
        setRules((r) => r.map((x) => (x.id === rule.id ? created : x)));
      } else {
        await fetch(`/api/pricing-rules/${rule.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
    } finally {
      setSavingId(null);
    }
  }

  async function removeRule(id: string) {
    if (!id.startsWith("draft-")) {
      await fetch(`/api/pricing-rules/${id}`, { method: "DELETE" });
    }
    setRules((r) => r.filter((rule) => rule.id !== id));
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="!text-base">Services and preliminary pricing</CardTitle>
          <p className="text-[11px] text-cv-muted mt-1">The AI never invents a number — it only reads wording you approve here.</p>
        </div>
        <Button variant="primary" size="sm" onClick={addRule}>
          <Icon name="add" className="!text-base" />
          Add service
        </Button>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        {rules.length === 0 && <p className="text-sm text-cv-muted py-4 text-center">No pricing rules yet — add one so the voice AI can quote a real range.</p>}
        {rules.map((rule) => (
          <div key={rule.id} className="border border-cv-border rounded-xl p-3.5 flex flex-col gap-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr_1fr] gap-2.5">
              <FormGroup label="Service">
                <Select value={rule.serviceCategory} onChange={(e) => update(rule.id, { serviceCategory: e.target.value })}>
                  {serviceOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </FormGroup>
              <FormGroup label="Pricing type">
                <Select value={rule.pricingType} onChange={(e) => update(rule.id, { pricingType: e.target.value as PricingType })}>
                  {PRICING_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </FormGroup>
              <FormGroup label="Amount">
                {rule.pricingType === "preliminary_range" && (
                  <div className="flex items-center gap-1.5">
                    <Field
                      className="font-cv-mono"
                      placeholder="min"
                      value={centsToDollarsStr(rule.minimumAmount)}
                      onChange={(e) => update(rule.id, { minimumAmount: e.target.value ? Math.round(Number(e.target.value) * 100) : null })}
                    />
                    <span>–</span>
                    <Field
                      className="font-cv-mono"
                      placeholder="max"
                      value={centsToDollarsStr(rule.maximumAmount)}
                      onChange={(e) => update(rule.id, { maximumAmount: e.target.value ? Math.round(Number(e.target.value) * 100) : null })}
                    />
                  </div>
                )}
                {rule.pricingType === "fixed" && (
                  <Field
                    className="font-cv-mono"
                    placeholder="$0.00"
                    value={centsToDollarsStr(rule.fixedAmount)}
                    onChange={(e) => update(rule.id, { fixedAmount: e.target.value ? Math.round(Number(e.target.value) * 100) : null })}
                  />
                )}
                {rule.pricingType === "starting" && (
                  <Field
                    className="font-cv-mono"
                    placeholder="$0.00"
                    value={centsToDollarsStr(rule.startingAmount)}
                    onChange={(e) => update(rule.id, { startingAmount: e.target.value ? Math.round(Number(e.target.value) * 100) : null })}
                  />
                )}
                {rule.pricingType === "inspection_required" && <Badge color="gray">No amount</Badge>}
              </FormGroup>
            </div>
            <FormGroup label="Caller-facing wording">
              <TextArea
                value={rule.approvedCustomerMessage}
                onChange={(e) => update(rule.id, { approvedCustomerMessage: e.target.value })}
                placeholder="The exact sentence the AI reads verbatim to callers."
              />
            </FormGroup>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <Toggle checked={rule.isActive} onChange={(v) => update(rule.id, { isActive: v })} />
                <span className="text-xs text-cv-muted">{rule.isActive ? "Live" : "Disabled"}</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="danger" onClick={() => removeRule(rule.id)}>
                  Remove
                </Button>
                <Button size="sm" variant="primary" onClick={() => saveRule(rule)} disabled={savingId === rule.id}>
                  {savingId === rule.id ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

// ─── Notifications ──────────────────────────────────────────────────────────

function NotificationsPanel({ business }: { business: Business }) {
  const [ownerEmail, setOwnerEmail] = useState(business.ownerEmail);
  const [ownerPhone, setOwnerPhone] = useState(business.ownerPhone ?? "");
  const [qualifiedLead, setQualifiedLead] = useState(business.notificationPreferences?.qualifiedLead ?? true);
  const [weeklyReport, setWeeklyReport] = useState(business.notificationPreferences?.weeklyReport ?? true);
  const { loading, saved, error, save } = useSave();

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="!text-base">Lead notifications</CardTitle>
          <p className="text-[11px] text-cv-muted mt-1">Email contains the full packet — score, reasoning, answers, and recommended action.</p>
        </div>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormGroup label="Primary email">
            <Field type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} />
          </FormGroup>
          <FormGroup label="Mobile number">
            <Field className="font-cv-mono" value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
          </FormGroup>
        </div>

        <div className="flex justify-between items-center py-3.5 border-t border-cv-border">
          <div>
            <strong className="block text-xs">Email every qualified lead</strong>
            <span className="block text-cv-muted text-[10px] mt-1">Turn off to stop lead emails entirely — not recommended.</span>
          </div>
          <Toggle checked={qualifiedLead} onChange={setQualifiedLead} />
        </div>
        <div className="flex justify-between items-center py-3.5 border-t border-cv-border">
          <div>
            <strong className="block text-xs">Weekly performance report</strong>
            <span className="block text-cv-muted text-[10px] mt-1">Seven-day summary of captured, contacted, won, and lost leads.</span>
          </div>
          <Toggle checked={weeklyReport} onChange={setWeeklyReport} />
        </div>
        <div className="flex justify-between items-center py-3.5 border-t border-cv-border opacity-50">
          <div>
            <strong className="block text-xs">SMS alerts</strong>
            <span className="block text-cv-muted text-[10px] mt-1">Text alert to your mobile number for urgent leads. Coming soon.</span>
          </div>
          <Toggle checked={false} onChange={() => {}} />
        </div>

        {error && <p className="text-sm text-cv-red">{error}</p>}
        <Button
          variant="primary"
          className="self-end"
          disabled={loading}
          onClick={() =>
            save({
              ownerEmail,
              ownerPhone: ownerPhone || null,
              notificationPreferences: { ...business.notificationPreferences, qualifiedLead, weeklyReport },
            })
          }
        >
          {loading ? "Saving…" : saved ? "Saved ✓" : "Save notifications"}
        </Button>
      </CardBody>
    </Card>
  );
}

// ─── Team (stub) ─────────────────────────────────────────────────────────────

function TeamPanel({ business }: { business: Business }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="!text-base">Team</CardTitle>
          <p className="text-[11px] text-cv-muted mt-1">Control who can receive and work leads.</p>
        </div>
        <Button size="sm" disabled title="Multi-user accounts are coming soon">
          <Icon name="person_add" className="!text-base" />
          Invite
        </Button>
      </CardHeader>
      <CardBody>
        <div className="flex items-center gap-3 py-2">
          <div className="w-10 h-10 rounded-[11px] grid place-items-center bg-cv-gray-soft text-[#344054] font-extrabold text-xs shrink-0">
            {business.ownerName
              .split(" ")
              .slice(0, 2)
              .map((p) => p[0]?.toUpperCase())
              .join("")}
          </div>
          <div>
            <strong className="block text-[13px]">{business.ownerName}</strong>
            <span className="block text-cv-muted text-xs mt-0.5">Owner · {business.ownerEmail}</span>
          </div>
          <Badge color="blue" className="ml-auto">
            Admin
          </Badge>
        </div>
        <p className="text-xs text-cv-muted mt-3">Additional team members with their own logins are coming soon.</p>
      </CardBody>
    </Card>
  );
}

// ─── Integrations (stub) ─────────────────────────────────────────────────────

function IntegrationsPanel() {
  const items = [
    { name: "Webhook", desc: "Send lead.created, lead.qualified, and lead.updated events." },
    { name: "Zapier", desc: "Connect Callverted to thousands of apps." },
    { name: "Jobber", desc: "Push qualified leads into customer and request records." },
    { name: "Housecall Pro", desc: "Push qualified leads for scheduling and dispatch." },
  ];
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="!text-base">Integrations</CardTitle>
          <p className="text-[11px] text-cv-muted mt-1">Push qualified opportunities into the tools your team already uses.</p>
        </div>
      </CardHeader>
      <CardBody className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {items.map((i) => (
          <div key={i.name} className="border border-cv-border rounded-[11px] p-3.5">
            <strong className="text-xs">{i.name}</strong>
            <p className="text-[11px] text-cv-muted mt-1.5 mb-3">{i.desc}</p>
            <Badge color="gray">Coming soon</Badge>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

// ─── Billing ────────────────────────────────────────────────────────────────

const PLAN_PRICE = 79;
const PLAN_FEATURES = [
  "AI voice overflow — answers and qualifies calls your team can't get to",
  "Public lead intake form — shareable link and website embed",
  "Deterministic lead scoring — urgency, quality, and estimated job value",
  "AI-generated reasoning behind every score, with recommended next action",
  "Business-approved preliminary price ranges, configured per service category",
  "Lead dashboard with status tracking, search, and filtering",
  "Email alert on every qualified lead, plus a weekly recap",
  "Unlimited leads — no caps or overages",
];

interface CompanyBilling {
  subscriptionStatus: string | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  canceledAt: string | null;
  stripeSubscriptionId: string | null;
}

function BillingPanel() {
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [billing, setBilling] = useState<CompanyBilling | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/company");
        if (!res.ok) throw new Error("Failed to load billing data");
        const company = await res.json();
        setBilling({
          subscriptionStatus: company.subscriptionStatus,
          trialEndsAt: company.trialEndsAt,
          currentPeriodEnd: company.currentPeriodEnd,
          canceledAt: company.canceledAt,
          stripeSubscriptionId: company.stripeSubscriptionId,
        });
      } catch (err) {
        console.error("Error loading billing:", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  async function handleStartTrial() {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create checkout session");
      window.location.href = data.url;
    } catch (err) {
      console.error("Checkout error:", err);
      setIsProcessing(false);
    }
  }

  async function handleManageSubscription() {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to open portal");
      window.location.href = data.url;
    } catch (err) {
      console.error("Portal error:", err);
      setIsProcessing(false);
    }
  }

  function formatDate(d: string | null) {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  }

  if (isLoading) {
    return (
      <Card>
        <CardBody className="text-sm text-cv-muted">Loading billing information…</CardBody>
      </Card>
    );
  }

  const hasSubscription = !!billing?.stripeSubscriptionId;
  const isTrialing = billing?.subscriptionStatus === "trialing";
  const isActive = billing?.subscriptionStatus === "active";
  const GRACE_MS = 60 * 1000;
  const isTrialExpired = isTrialing && billing?.trialEndsAt && new Date(billing.trialEndsAt).getTime() + GRACE_MS <= Date.now();
  const isCanceledButActive = isActive && billing?.canceledAt && new Date(billing.canceledAt) > new Date();
  const daysRemaining = isTrialing && billing?.trialEndsAt ? Math.ceil((new Date(billing.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="!text-base">Convert plan</CardTitle>
          <p className="text-[11px] text-cv-muted mt-1">Voice overflow, web capture, qualification, pricing rules, and revenue reporting.</p>
        </div>
        <Badge color={isActive ? "green" : isTrialing ? "blue" : "gray"}>{isActive ? "Active" : isTrialing ? "Trial" : "No subscription"}</Badge>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        <div>
          <span className="font-cv-heading text-[28px] font-bold">${PLAN_PRICE}</span>
          <span className="text-cv-muted text-[13px]"> / month</span>
        </div>
        <ul className="flex flex-col gap-2">
          {PLAN_FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-2 text-[13px] text-cv-muted">
              <Icon name="check" className="!text-base text-cv-green shrink-0 mt-0.5" />
              {f}
            </li>
          ))}
        </ul>

        {isTrialExpired && <Badge color="red">Trial expired — {formatDate(billing?.trialEndsAt ?? null)}</Badge>}
        {isTrialing && !isTrialExpired && <Badge color="blue">{daysRemaining} days left in your free trial</Badge>}
        {isCanceledButActive && <Badge color="amber">Canceled — access until {formatDate(billing?.canceledAt ?? null)}</Badge>}

        {!hasSubscription ? (
          <Button variant="primary" size="lg" disabled={isProcessing} onClick={handleStartTrial}>
            {isProcessing ? "Processing…" : `Start 14-Day Free Trial — $${PLAN_PRICE}/mo after`}
          </Button>
        ) : (
          <Button disabled={isProcessing} onClick={handleManageSubscription}>
            <Icon name="open_in_new" className="!text-base" />
            {isProcessing ? "Opening…" : "Manage subscription"}
          </Button>
        )}
      </CardBody>
    </Card>
  );
}

// ─── Business profile ────────────────────────────────────────────────────────

function BusinessProfilePanel({ business }: { business: Business }) {
  const [businessName, setBusinessName] = useState(business.businessName);
  const [ownerName, setOwnerName] = useState(business.ownerName);
  const [serviceArea, setServiceArea] = useState(business.serviceArea ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(business.websiteUrl ?? "");
  const { loading, saved, error, save } = useSave();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="!text-base">Business profile</CardTitle>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormGroup label="Business name">
            <Field value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
          </FormGroup>
          <FormGroup label="Vertical">
            <div className="h-10 flex items-center gap-2 px-[11px] border border-cv-border rounded-[9px] bg-cv-surface-subtle text-sm capitalize">
              {business.vertical}
              <Badge color="blue" className="ml-auto">
                Active
              </Badge>
            </div>
          </FormGroup>
          <FormGroup label="Owner name">
            <Field value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
          </FormGroup>
          <FormGroup label="Timezone">
            <Field value={business.timezone} readOnly />
          </FormGroup>
          <FormGroup label="Primary service area">
            <Field value={serviceArea} onChange={(e) => setServiceArea(e.target.value)} placeholder="Greater Chicago Area" />
          </FormGroup>
          <FormGroup label="Website">
            <Field type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://example.com" />
          </FormGroup>
        </div>
        {error && <p className="text-sm text-cv-red">{error}</p>}
        <Button
          variant="primary"
          className="self-end"
          disabled={loading}
          onClick={() => save({ businessName, ownerName, serviceArea: serviceArea || null, websiteUrl: websiteUrl || null })}
        >
          {loading ? "Saving…" : saved ? "Saved ✓" : "Save profile"}
        </Button>
      </CardBody>
    </Card>
  );
}
