"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { Icon } from "./primitives";
import { timeAgoShort } from "@/lib/leads/priority";
import type { BannerState } from "@/components/dashboard/subscription-banner";
import { SubscriptionBannerV2 } from "./SubscriptionBannerV2";
import { CallvertedLogo } from "@/components/CallvertedLogo";

const NAV_SECTIONS = [
  {
    label: "Operate",
    links: [
      { href: "/dashboard", label: "Home", icon: "space_dashboard", exact: true },
      { href: "/dashboard/leads", label: "Leads", icon: "person_search", exact: false, badgeKey: "leads" as const },
      { href: "/dashboard/calls", label: "Calls", icon: "call", exact: false },
    ],
  },
  {
    label: "Grow",
    links: [
      { href: "/dashboard/capture", label: "Capture", icon: "capture", exact: false },
      { href: "/dashboard/reports", label: "Reports", icon: "monitoring", exact: false },
    ],
  },
  {
    label: "Configure",
    links: [
      { href: "/dashboard/settings", label: "Settings", icon: "tune", exact: false },
      { href: "/dashboard/test-call", label: "Test call", icon: "forum", exact: false },
    ],
  },
];

const VERTICAL_ICONS: Record<string, string> = {
  restoration: "water_damage",
  plumbing: "plumbing",
  hvac: "mode_fan",
  electrical: "electrical_services",
};

function formatUsPhone(e164: string) {
  const m = e164.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : e164;
}

export interface RecentLead {
  id: string;
  callerName: string | null;
  callerPhone: string;
  createdAt: Date;
}

interface Props {
  businessName: string;
  serviceArea: string | null;
  vertical: string;
  isVoiceLive: boolean;
  /** The provisioned Callverted (Twilio) number, or null before go-live. Shown
   * in the sidebar card so the operator always knows the number to give out. */
  callvertedNumber: string | null;
  newLeadsCount: number;
  recentNewLeads: RecentLead[];
  bannerState: BannerState;
  children: React.ReactNode;
}

export function DashboardShell({
  businessName,
  serviceArea,
  vertical,
  isVoiceLive,
  callvertedNumber,
  newLeadsCount,
  recentNewLeads,
  bannerState,
  children,
}: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen bg-cv-bg font-cv-body text-cv-ink">
      <aside
        className={`w-[252px] h-screen fixed inset-y-0 left-0 bg-cv-surface border-r border-cv-border flex flex-col z-50 transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <Link href="/dashboard" className="flex items-center gap-[11px] px-5 pt-[22px] pb-[18px]">
          <CallvertedLogo className="w-[34px] h-[34px] rounded-[10px] shadow-[0_6px_18px_rgba(36,84,216,.25)]" gradientId="cvLogoDashboardNav" />
          <div className="font-cv-heading font-bold text-[23px] leading-none tracking-tight text-cv-primary-dark">
            Callverted
          </div>
        </Link>

        <div className="mx-3.5 mb-3.5 p-3 bg-cv-surface-subtle border border-cv-border rounded-xl flex items-center gap-2.5">
          <div className="w-[34px] h-[34px] rounded-[9px] grid place-items-center bg-cv-primary-soft text-cv-primary shrink-0">
            <Icon name={VERTICAL_ICONS[vertical] ?? "storefront"} className="!text-lg" />
          </div>
          <div className="min-w-0">
            <strong className="block text-[13px] truncate">{businessName}</strong>
            <small className="block text-cv-muted text-[11px] truncate">
              {serviceArea ?? "Service area not set"} · {isVoiceLive ? "Live" : "Not live"}
            </small>
            {callvertedNumber && (
              <small className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-cv-primary-dark">
                <Icon name="call" className="!text-[13px] shrink-0" />
                <span className="truncate">{formatUsPhone(callvertedNumber)}</span>
              </small>
            )}
          </div>
        </div>

        <nav className="px-3 pb-3 pt-0.5 flex-1 overflow-y-auto">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <div className="px-2.5 pt-4 pb-[7px] text-cv-muted-2 text-[10px] font-extrabold tracking-[.09em] uppercase">
                {section.label}
              </div>
              {section.links.map((link) => {
                const active = isActive(link.href, link.exact);
                const badge = link.badgeKey === "leads" ? newLeadsCount : 0;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`w-full flex items-center gap-[11px] px-[11px] py-2.5 rounded-[9px] my-0.5 text-sm font-semibold transition-colors duration-150 ${
                      active ? "bg-cv-primary-soft text-cv-primary-dark" : "text-[#475467] hover:bg-cv-surface-subtle hover:text-cv-ink"
                    }`}
                  >
                    <Icon name={link.icon} className={active ? "text-cv-primary" : ""} />
                    {link.label}
                    {badge > 0 && (
                      <span className="ml-auto min-w-[21px] h-[21px] px-1.5 grid place-items-center rounded-full bg-cv-red text-white text-[10px] font-extrabold">
                        {badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-cv-border px-3 py-3.5">
          <Link
            href="/dashboard/help"
            className="w-full flex items-center gap-[11px] px-[11px] py-2.5 rounded-[9px] text-[13px] font-semibold text-[#475467] hover:bg-cv-surface-subtle hover:text-cv-ink transition-colors"
          >
            <Icon name="help" />
            Help center
          </Link>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <div className="md:ml-[252px] min-h-screen">
        <header className="h-[66px] sticky top-0 z-30 flex items-center justify-between gap-4.5 px-3.5 md:px-7 bg-white/92 backdrop-blur-md border-b border-cv-border">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="md:hidden w-10 h-10 rounded-[10px] grid place-items-center text-cv-muted hover:bg-cv-surface-subtle hover:text-cv-ink"
              aria-label="Toggle menu"
            >
              <Icon name={mobileOpen ? "close" : "menu"} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setNotifOpen((o) => !o)}
                className="relative w-10 h-10 rounded-[10px] grid place-items-center text-cv-muted hover:bg-cv-surface-subtle hover:text-cv-ink"
                aria-label="Notifications"
              >
                <Icon name="notifications" />
                {newLeadsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[15px] h-[15px] px-1 grid place-items-center rounded-full bg-cv-red text-white text-[9px] font-extrabold">
                    {newLeadsCount > 9 ? "9+" : newLeadsCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 top-[calc(100%+8px)] w-[300px] bg-white border border-cv-border rounded-[14px] shadow-cv-sm z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-cv-border">
                      <strong className="text-[13px]">New leads</strong>
                    </div>
                    {recentNewLeads.length === 0 ? (
                      <p className="px-4 py-6 text-center text-xs text-cv-muted">No new leads right now.</p>
                    ) : (
                      <div className="max-h-80 overflow-y-auto">
                        {recentNewLeads.map((lead) => (
                          <Link
                            key={lead.id}
                            href={`/dashboard/leads/${lead.id}`}
                            onClick={() => setNotifOpen(false)}
                            className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-cv-border last:border-b-0 hover:bg-cv-surface-subtle transition-colors"
                          >
                            <div className="min-w-0">
                              <strong className="block text-xs truncate">{lead.callerName ?? lead.callerPhone}</strong>
                              <span className="block text-[11px] text-cv-muted truncate">{lead.callerPhone}</span>
                            </div>
                            <span className="text-[10px] text-cv-muted shrink-0">{timeAgoShort(lead.createdAt)}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                    <Link
                      href="/dashboard/leads?status=new"
                      onClick={() => setNotifOpen(false)}
                      className="block px-4 py-2.5 text-center text-xs font-bold text-cv-primary hover:bg-cv-surface-subtle transition-colors"
                    >
                      View all new leads
                    </Link>
                  </div>
                </>
              )}
            </div>
            <Link
              href="/dashboard/leads/new"
              className="hidden sm:inline-flex items-center justify-center gap-2 rounded-[9px] border border-cv-primary bg-cv-primary text-white font-bold text-xs min-h-[34px] px-[11px] hover:bg-cv-primary-dark transition-colors"
            >
              <Icon name="add" className="!text-base" />
              Add lead
            </Link>
            <UserButton />
          </div>
        </header>

        <SubscriptionBannerV2 state={bannerState} />

        <main className="p-5 md:p-7 max-w-[1500px] mx-auto">{children}</main>
      </div>
    </div>
  );
}
