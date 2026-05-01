"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { cn } from "@/lib/utils";

export type CalendarDayInfo = {
  tone: "green" | "amber" | "red";
  sessionId: string;
};

export function CleaningCalendar({
  month,
  days,
}: {
  month: Date; // any day in month
  days: Record<string, CalendarDayInfo>;
}) {
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const toneClasses: Record<CalendarDayInfo["tone"], string> = {
    green: "bg-emerald-100 border-emerald-200 text-emerald-900",
    amber: "bg-amber-100 border-amber-200 text-amber-900",
    red: "bg-red-100 border-red-200 text-red-900",
  };

  const monthLabel = format(month, "MMMM yyyy");
  const prev = addMonths(month, -1);
  const next = addMonths(month, 1);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Link
          href={`/admin/history?month=${format(prev, "yyyy-MM")}`}
          className="text-sm font-semibold text-sky-700 underline decoration-sky-300"
        >
          Anterior
        </Link>
        <div className="text-base font-semibold">{monthLabel}</div>
        <Link
          href={`/admin/history?month=${format(next, "yyyy-MM")}`}
          className="text-sm font-semibold text-sky-700 underline decoration-sky-300"
        >
          Siguiente
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-zinc-500">
        {["M", "T", "W", "T", "F", "S", "S"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((d) => {
          const key = format(d, "yyyy-MM-dd");
          const info = days[key];
          const inMonth = isSameMonth(d, month);
          const dayNum = format(d, "d");
          const base = cn(
            "h-12 rounded-xl border text-sm font-semibold flex items-center justify-center",
            inMonth ? "opacity-100" : "opacity-40",
            isToday(d) ? "ring-2 ring-sky-400" : null,
            info ? toneClasses[info.tone] : "bg-white border-zinc-200 text-zinc-700",
          );

          return info ? (
            <Link
              key={key}
              href={`/admin/history/${info.sessionId}`}
              className={base}
              aria-label={`Sesión ${key}`}
            >
              {dayNum}
            </Link>
          ) : (
            <div key={key} className={base}>
              {dayNum}
            </div>
          );
        })}
      </div>
    </div>
  );
}

