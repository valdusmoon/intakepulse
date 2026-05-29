"use client";

import dynamic from "next/dynamic";

const ScheduleCalendar = dynamic(() => import("./schedule-calendar"), { ssr: false });

export default function ScheduleWrapper() {
  return <ScheduleCalendar />;
}
