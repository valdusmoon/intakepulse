"use client";

export function CalendlyButton({ className, children }: { className: string; children: React.ReactNode }) {
  function openCalendly() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Calendly?.initPopupWidget({ url: "https://calendly.com/nileh/demo" });
  }

  return (
    <button onClick={openCalendly} className={className}>
      {children}
    </button>
  );
}
