"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";

const STORAGE_KEY = "ip-help-banner-dismissed";

export function NewUserBanner({ businessCreatedAt }: { businessCreatedAt: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    const isNew = Date.now() - new Date(businessCreatedAt).getTime() < 7 * 24 * 60 * 60 * 1000;
    if (!dismissed && isNew) setVisible(true);
  }, [businessCreatedAt]);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-2.5">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
        <p className="text-xs text-indigo-700">
          New to Callverted?{" "}
          <Link href="/dashboard/help" className="font-semibold underline hover:text-indigo-900">
            Read the setup guide →
          </Link>
        </p>
        <button
          onClick={dismiss}
          className="text-indigo-400 hover:text-indigo-600 shrink-0 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
