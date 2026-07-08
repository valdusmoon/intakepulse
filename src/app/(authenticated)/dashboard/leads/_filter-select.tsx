"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/dashboard/v2/primitives";

interface Props {
  name: string;
  value: string;
  options: { value: string; label: string }[];
  currentParams: Record<string, string>;
}

/** A filter dropdown that navigates immediately on change, preserving every
 * other active filter — selects are discrete, single clicks, so there's no
 * reason to batch them behind a separate "Apply" step the way a free-text
 * search field (which needs debouncing or an explicit submit) would. */
export function FilterSelect({ name, value, options, currentParams }: Props) {
  const router = useRouter();

  function onChange(next: string) {
    const merged = { ...currentParams, [name]: next };
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v);
    }
    const qs = params.toString();
    router.push(`/dashboard/leads${qs ? `?${qs}` : ""}`);
  }

  return (
    // Select's base styling is w-full, meant to fill a wrapping container
    // (as it does everywhere else it's used) — constrain that container here
    // rather than fight the child's own width utility.
    <div className="shrink-0 w-full sm:w-[170px]">
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
