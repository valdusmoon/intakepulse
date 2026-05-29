"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

const STATUS_LABELS: Record<string, string> = {
  new: "New", contacted: "Contacted", quoted: "Quoted",
  scheduled: "Scheduled", won: "Won", completed: "Completed", lost: "Lost",
};

export function LeadsStatusFilter({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value) {
      params.set("status", e.target.value);
    } else {
      params.delete("status");
    }
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      defaultValue={defaultValue ?? ""}
      onChange={handleChange}
      className="border-[1.5px] border-[#CBD5E1] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F97316] focus:shadow-[0_0_0_3px_rgba(249,115,22,.1)] bg-white text-[#1E293B]"
    >
      <option value="">All statuses</option>
      {Object.entries(STATUS_LABELS).map(([val, label]) => (
        <option key={val} value={val}>{label}</option>
      ))}
    </select>
  );
}
