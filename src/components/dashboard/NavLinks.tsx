"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Home", exact: true },
  { href: "/dashboard/leads", label: "Leads", exact: false },
  { href: "/dashboard/settings", label: "Settings", exact: false },
  { href: "/dashboard/billing", label: "Billing", exact: false },
];

export function NavLinks() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  return (
    <>
      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-1">
        {links.map(({ href, label, exact }) => (
          <Link
            key={href}
            href={href}
            className={`text-sm px-2.5 py-1.5 rounded-lg transition-colors ${
              isActive(href, exact)
                ? "text-orange-500 bg-orange-50 font-semibold"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="md:hidden p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        aria-label="Toggle menu"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden absolute top-[57px] left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50">
          <div className="px-4 py-2 space-y-1">
            {links.map(({ href, label, exact }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`block text-sm px-3 py-2.5 rounded-lg transition-colors ${
                  isActive(href, exact)
                    ? "text-orange-500 bg-orange-50 font-semibold"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
