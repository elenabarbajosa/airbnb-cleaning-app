import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";
import { AdminMobileNav } from "./ui";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("admin");

  return (
    <div className="min-h-[100dvh] w-full bg-[#f7f8fb]">
      <div className="sticky top-0 z-20 border-b border-sky-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="text-lg font-semibold tracking-tight">Admin</div>
            <nav className="hidden gap-3 text-sm font-medium text-zinc-700 sm:flex">
              <Link className="hover:text-sky-900" href="/admin">
                Panel de control
              </Link>
              <Link className="hover:text-sky-900" href="/admin/checklist">
                Lista de tareas
              </Link>
              <Link className="hover:text-sky-900" href="/admin/notes">
                Notas
              </Link>
              <Link className="hover:text-sky-900" href="/admin/history">
                Historial
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <div className="sm:hidden">
              <AdminMobileNav />
            </div>
            <LogoutButton className="hidden sm:inline-flex" />
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-5xl px-4 py-5">{children}</main>
    </div>
  );
}

