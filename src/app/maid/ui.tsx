"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function MaidHome({ activeSessionId }: { activeSessionId: string | null }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function startCleaning() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/maid/start", { method: "POST" });
      if (!res.ok) {
        const msg = await res.text();
        setError(msg || "No se pudo iniciar la limpieza.");
        return;
      }
      const data = (await res.json()) as { sessionId: string };
      router.push(`/maid/cleaning/${data.sessionId}`);
    });
  }

  return (
    <div className="min-h-[100dvh] w-full px-4 py-6">
      <div className="mx-auto w-full max-w-xl space-y-4">
        <div className="text-2xl font-semibold tracking-tight">Limpieza</div>

        {activeSessionId ? (
          <Card className="p-4">
            <div className="text-base font-semibold">Tienes una sesión en curso</div>
            <div className="mt-3 flex gap-3">
              <Button size="xl" className="flex-1" onClick={() => router.push(`/maid/cleaning/${activeSessionId}`)}>
                Continuar limpieza
              </Button>
              <Button
                size="xl"
                variant="secondary"
                className="flex-1"
                onClick={startCleaning}
                disabled={isPending}
              >
                Nueva
              </Button>
            </div>
          </Card>
        ) : (
          <Button size="xl" className="w-full" onClick={startCleaning} disabled={isPending}>
            {isPending ? "Iniciando…" : "Iniciar limpieza"}
          </Button>
        )}

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}
      </div>
    </div>
  );
}

