"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardBody, Field, Icon } from "@/components/dashboard/v2/primitives";

interface AvailableNumber {
  phoneNumber: string;
  friendlyName: string;
  locality: string | null;
  region: string | null;
}

/**
 * Post-payment "choose your live number" step (Model B, shown while
 * getSetupStage === "provisioning": card on file, no number yet). Live Twilio
 * search by area code -> pick -> buy. A number can't be reserved without buying
 * it, so this only runs after checkout — nobody is charged for a number they
 * never picked. On success the business gets its twilioPhoneNumber and the
 * dashboard advances to the "publish your number" step.
 */
export function ChooseNumber({ assistedUrl }: { assistedUrl: string | null }) {
  const router = useRouter();
  const [areaCode, setAreaCode] = useState("");
  const [numbers, setNumbers] = useState<AvailableNumber[]>([]);
  const [searching, setSearching] = useState(false);
  const [buying, setBuying] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSearch() {
    if (!/^\d{3}$/.test(areaCode)) {
      setError("Enter a 3-digit area code.");
      return;
    }
    setError("");
    setMessage("");
    setSearching(true);
    setNumbers([]);
    try {
      const res = await fetch("/api/twilio/numbers/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ areaCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed.");
      setNumbers(data.numbers ?? []);
      if ((data.numbers ?? []).length === 0) setMessage(data.message || "No numbers found. Try a nearby area code.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSearching(false);
    }
  }

  async function handleSelect(phoneNumber: string) {
    setError("");
    setBuying(phoneNumber);
    try {
      const res = await fetch("/api/twilio/numbers/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't get that number.");
      router.refresh(); // business now has a number -> dashboard advances
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBuying(null);
    }
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <div>
          <CardTitle>Choose your live number</CardTitle>
          <p className="text-[11px] text-cv-muted mt-1">Pick a local number near your service area. This becomes the line you publish.</p>
        </div>
        <span className="font-cv-mono text-xs font-bold text-cv-primary">Last step</span>
      </CardHeader>
      <CardBody className="flex flex-col gap-3">
        <div className="flex gap-2">
          <Field
            value={areaCode}
            onChange={(e) => setAreaCode(e.target.value.replace(/\D/g, "").slice(0, 3))}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Area code, e.g. 512"
            inputMode="numeric"
          />
          <button
            onClick={handleSearch}
            disabled={searching}
            className="shrink-0 px-4 rounded-xl bg-cv-primary text-white font-bold text-sm hover:bg-cv-primary-dark disabled:opacity-60 transition-colors"
          >
            {searching ? "Searching…" : "Search"}
          </button>
        </div>

        {numbers.length > 0 && (
          <div className="flex flex-col gap-2">
            {numbers.map((n) => {
              const isBuying = buying === n.phoneNumber;
              const place = [n.locality, n.region].filter(Boolean).join(", ");
              return (
                <div
                  key={n.phoneNumber}
                  className="flex items-center justify-between px-4 py-3 rounded-xl border border-cv-border"
                >
                  <div className="min-w-0">
                    <p className="font-cv-mono font-bold text-sm text-cv-ink">{n.friendlyName}</p>
                    {place && <p className="text-[11px] text-cv-muted mt-0.5">{place}</p>}
                  </div>
                  <button
                    onClick={() => handleSelect(n.phoneNumber)}
                    disabled={!!buying}
                    className="shrink-0 px-3.5 py-2 rounded-lg bg-cv-primary text-white text-xs font-bold hover:bg-cv-primary-dark disabled:opacity-60 transition-colors"
                  >
                    {isBuying ? "Setting up…" : "Get this number"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {message && <p className="text-xs text-cv-muted">{message}</p>}
        {error && <p className="text-sm text-cv-red">{error}</p>}

        {assistedUrl && (
          <a
            href={assistedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-cv-primary hover:underline"
          >
            <Icon name="calendar_month" className="!text-[15px]" />
            Rather have us set it up? Book a 15 min call
          </a>
        )}
      </CardBody>
    </Card>
  );
}
