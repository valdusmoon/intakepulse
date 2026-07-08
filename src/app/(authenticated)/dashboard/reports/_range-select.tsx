"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/dashboard/v2/primitives";

export function RangeSelect({ current, options }: { current: number; options: { value: string; label: string }[] }) {
  const router = useRouter();
  return (
    <Select value={String(current)} onChange={(e) => router.push(`/dashboard/reports?range=${e.target.value}`)}>
      {options.map((r) => (
        <option key={r.value} value={r.value}>
          {r.label}
        </option>
      ))}
    </Select>
  );
}
