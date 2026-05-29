"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "How accurate are the instant estimates?",
    a: "Accurate enough to start the conversation — typically within 20–35% of the final quote. Every estimate is labeled \"ballpark only\" so homeowners know the real number comes after your visit. Sets expectations upfront, prevents sticker shock.",
  },
  {
    q: "Do I need to change how I work?",
    a: "No. You get a link and a QR code. Put them wherever you want — business cards, truck, yard signs, Instagram bio. Homeowners use it on their own. You just get the lead notification. Nothing about your existing workflow changes.",
  },
  {
    q: "I already use Jobber or Housecall Pro. Does this replace that?",
    a: "CraftCapture is built to handle the front end of the job cycle — lead capture, quotes, contracts, and scheduling. Some painters use it alongside broader field-service tools like Jobber, while others use it as their main system for managing new work. It depends on how much of your workflow you want in one place.",
  },
  {
    q: "What if I get a lead from a phone call, not the form?",
    a: "Add them manually in your dashboard in about 30 seconds. Enter their contact info, describe the job, and optionally get an instant estimate. They get added to your pipeline like any other lead.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel through your billing settings any time — no phone calls, no forms, no retention pressure. Your existing leads remain accessible even after cancellation.",
  },
];

export function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null);

  function toggle(i: number) {
    setOpen(open === i ? null : i);
  }

  return (
    <div className="l-faq-list">
      {FAQS.map((faq, i) => (
        <div key={i} className={`l-faqitem${open === i ? " open" : ""}`}>
          <button className="l-faqq" onClick={() => toggle(i)}>
            {faq.q}
            <span className="l-faqarrow">▼</span>
          </button>
          <div className="l-faqa">{faq.a}</div>
        </div>
      ))}
    </div>
  );
}
