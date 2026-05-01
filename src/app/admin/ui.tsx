"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { LogoutButton } from "@/components/LogoutButton";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string };

const items: Item[] = [
  { href: "/admin", label: "Panel de control" },
  { href: "/admin/checklist", label: "Lista de tareas" },
  { href: "/admin/notes", label: "Notas" },
  { href: "/admin/history", label: "Historial" },
];

export function AdminMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const active = useMemo(() => items.find((i) => pathname === i.href)?.label ?? "Menú", [pathname]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (!open) return;
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="relative">
      <button
        type="button"
        className={cn(
          "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-sky-200 bg-white px-3 text-base font-semibold text-zinc-900 shadow-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f8fb]",
          "active:bg-sky-50",
        )}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Abrir menú de administración"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="max-w-[10rem] truncate">{active}</span>
        <span aria-hidden className="text-xl leading-none">
          ☰
        </span>
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-black/10"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
          />
          <div
            ref={panelRef}
            role="menu"
            className="absolute right-0 top-12 z-50 w-[min(92vw,22rem)] overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-lg"
          >
            <div className="px-4 py-3">
              <div className="text-sm font-semibold text-zinc-900">Administración</div>
              <div className="text-xs text-zinc-600">Navegación</div>
            </div>

            <div className="border-t border-sky-100">
              {items.map((it) => {
                const isActive = pathname === it.href;
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    role="menuitem"
                    className={cn(
                      "flex w-full items-center px-4 py-4 text-base font-semibold",
                      isActive ? "bg-sky-50 text-sky-900" : "text-zinc-800",
                      "active:bg-sky-100",
                    )}
                  >
                    {it.label}
                  </Link>
                );
              })}
            </div>

            <div className="border-t border-sky-100 p-2">
              <LogoutButton className="w-full justify-center" />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

