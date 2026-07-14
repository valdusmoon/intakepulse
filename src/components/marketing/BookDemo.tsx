"use client";

import { useEffect, useState } from "react";

/**
 * A self-contained "book a demo / leave your details" trigger + modal for the
 * /v4 landing. Each instance renders its own trigger button (styled via
 * className) and its own modal, so it can be dropped anywhere (hero CTA, closing
 * CTA, the corner chat bubble) without shared state.
 *
 * The modal offers two paths: book a call (Calendly) or leave an email/phone and
 * we reach out. The "reach out" form POSTs to /api/capture with source
 * "demo_request" — that saves an email_captures row and fires a founder alert to
 * NOTIFY_EMAIL so a real person actually follows up (it does NOT create a leads
 * row; those are the operator's own callers, not marketing prospects).
 */

const DEMO_URL = process.env.NEXT_PUBLIC_DEMO_BOOKING_URL ?? "https://calendly.com/nileh/demo";

export function BookDemo({
  className,
  children,
  title = "Let's get you set up",
  blurb = "Book a quick call, or leave your details and we'll reach out. A real person, usually same day.",
}: {
  className?: string;
  children: React.ReactNode;
  title?: string;
  blurb?: string;
}) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function close() {
    setOpen(false);
    // Reset so a reopened modal starts fresh (but keep it simple — leave the
    // success state untouched if they reopen right after sending).
    setError("");
    setSubmitting(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source: "demo_request",
          context: { name, phone: phone || undefined },
        }),
      });
      if (!res.ok) throw new Error("failed");
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again, or book a time above.");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {children}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <div className="absolute inset-0 bg-[#0a0f1c]/60 backdrop-blur-sm" onClick={close} />
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl">
            <button
              type="button"
              onClick={close}
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-[#98a2b3] hover:bg-[#f2f4f7] hover:text-[#152033] transition-colors"
              aria-label="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>

            {!sent ? (
              <>
                <h3 className="font-cv-heading text-xl font-bold text-[#152033] mb-1.5 pr-8">{title}</h3>
                <p className="text-[13.5px] text-[#667085] leading-relaxed mb-5">{blurb}</p>

                <a
                  href={DEMO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-landing-primary text-white py-3 font-semibold text-sm hover:bg-blue-600 transition-colors mb-4"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                  Book a 15-minute demo
                </a>

                <div className="flex items-center gap-3 mb-4">
                  <span className="h-px flex-1 bg-[#eef1f4]" />
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[#98a2b3]">or</span>
                  <span className="h-px flex-1 bg-[#eef1f4]" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-2.5">
                  <input required type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-[#d0d7e2] px-3.5 py-2.5 text-sm text-[#152033] placeholder:text-[#98a2b3] focus:border-landing-primary focus:outline-none" />
                  <input required type="email" placeholder="Work email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-[#d0d7e2] px-3.5 py-2.5 text-sm text-[#152033] placeholder:text-[#98a2b3] focus:border-landing-primary focus:outline-none" />
                  <input type="tel" placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl border border-[#d0d7e2] px-3.5 py-2.5 text-sm text-[#152033] placeholder:text-[#98a2b3] focus:border-landing-primary focus:outline-none" />
                  <button type="submit" disabled={submitting} className="w-full rounded-xl bg-[#152033] text-white py-3 font-semibold text-sm hover:bg-[#0a0f1c] transition-colors disabled:opacity-60">
                    {submitting ? "Sending…" : "Have us reach out"}
                  </button>
                </form>
                {error && <p className="mt-2 text-[12px] text-[#d92d20] text-center">{error}</p>}
                <p className="mt-3 text-[11px] text-[#98a2b3] text-center">No spam. We only use this to help you get set up.</p>
              </>
            ) : (
              <div className="py-6 text-center">
                <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-[#eaf7f0] text-[#177245]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
                </span>
                <h3 className="font-cv-heading text-xl font-bold text-[#152033] mb-1.5">You&apos;re on the list.</h3>
                <p className="text-[13.5px] text-[#667085] leading-relaxed mb-5">We&apos;ll reach out shortly to help you get set up. Want to grab a time now?</p>
                <a href={DEMO_URL} target="_blank" rel="noopener noreferrer" className="inline-block rounded-xl bg-landing-primary text-white px-5 py-2.5 font-semibold text-sm hover:bg-blue-600 transition-colors">Book a time</a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
