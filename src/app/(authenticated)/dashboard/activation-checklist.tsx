"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink, QrCode, Star, Send } from "lucide-react";
import QRCode from "qrcode";

interface Props {
  quoteUrl: string;
  hasGoogleReviewUrl: boolean;
}

export default function ActivationChecklist({ quoteUrl, hasGoogleReviewUrl }: Props) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(quoteUrl, { width: 400, margin: 2 }).then(setQrDataUrl);
  }, [quoteUrl]);

  function copyLink() {
    navigator.clipboard.writeText(quoteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadQr() {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = "quote-qr-code.png";
    a.click();
  }

  const items: {
    done: boolean;
    label: string;
    description: string;
    action: React.ReactNode;
  }[] = [
    {
      done: false,
      label: "Copy your quote link",
      description: "Share it via text, email, social — anywhere homeowners can tap it.",
      action: (
        <button
          onClick={copyLink}
          className="flex items-center gap-1.5 text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors"
        >
          <Copy className="w-3.5 h-3.5" />
          {copied ? "Copied!" : "Copy link"}
        </button>
      ),
    },
    {
      done: false,
      label: "Add it to your Google Business Profile",
      description: "The fastest way to get your first lead — painters near you are searched daily.",
      action: (
        <a
          href="https://business.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open Google Business
        </a>
      ),
    },
    {
      done: false,
      label: "Download your QR code",
      description: "Print it on your truck, yard signs, or business cards.",
      action: (
        <button
          onClick={downloadQr}
          disabled={!qrDataUrl}
          className="flex items-center gap-1.5 text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors disabled:opacity-40"
        >
          <QrCode className="w-3.5 h-3.5" />
          Download QR
        </button>
      ),
    },
    {
      done: hasGoogleReviewUrl,
      label: "Add your Google Review URL",
      description: "Required to send automatic review requests when a job is complete.",
      action: !hasGoogleReviewUrl ? (
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-1.5 text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors"
        >
          <Star className="w-3.5 h-3.5" />
          Add in Settings
        </Link>
      ) : null,
    },
    {
      done: false,
      label: "Send yourself a test lead",
      description: "Open your quote form and fill it out as a homeowner would.",
      action: (
        <a
          href={quoteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          Open quote form
        </a>
      ),
    },
  ];

  const doneCount = items.filter((i) => i.done).length;

  return (
    <div
      className="bg-white border border-[#E2E8F0] rounded-[14px] overflow-hidden"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,.07),0 4px 16px rgba(0,0,0,.05)" }}
    >
      <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-start justify-between gap-4">
        <div>
          <h2
            className="text-[.9rem] font-bold text-[#0F1628]"
            style={{ fontFamily: "var(--font-sora)" }}
          >
            Get your first lead
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Complete these steps to go live. This panel disappears once your first lead arrives.
          </p>
        </div>
        <span className="shrink-0 text-xs font-semibold text-slate-400 mt-0.5">
          {doneCount}/{items.length}
        </span>
      </div>
      <div className="divide-y divide-[#F1F5F9]">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-3.5 px-5 py-4">
            <div
              className={`mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                item.done ? "bg-teal-500 border-teal-500" : "border-gray-300"
              }`}
            >
              {item.done && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-semibold ${
                  item.done ? "text-gray-400 line-through" : "text-[#1E293B]"
                }`}
              >
                {item.label}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
              {item.action && <div className="mt-2">{item.action}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
