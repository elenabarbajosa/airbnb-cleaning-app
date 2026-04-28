import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";

export default async function MaidLayout({ children }: { children: React.ReactNode }) {
  await requireRole("maid");

  return (
    <div className="min-h-[100dvh] w-full">
      <div className="sticky top-0 z-20 border-b border-zinc-200 bg-zinc-50/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/maid" className="text-lg font-semibold tracking-tight">
            Limpieza
          </Link>
          <LogoutButton />
        </div>
      </div>
      {children}
    </div>
  );
}

