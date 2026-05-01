"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function PublicCleaningHome() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function startCleaning() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/cleaning/start", { method: "POST" });
      if (!res.ok) {
        const msg = await res.text();
        setError(msg || "Não foi possível iniciar a limpeza.");
        return;
      }
      const data = (await res.json()) as { token: string };
      router.push(`/cleaning/${data.token}`);
    });
  }

  return (
    <div className="min-h-[100dvh] w-full bg-[#f7f8fb] px-4 py-6">
      <div className="mx-auto w-full max-w-xl space-y-4">
        <div className="space-y-1">
          <div className="text-2xl font-semibold tracking-tight text-zinc-900">Limpeza</div>
          <div className="text-sm text-zinc-600">Aponte e conclua a lista de tarefas.</div>
        </div>

        <Card className="border-zinc-200/70 bg-white/95 p-5 shadow-sm">
          <div className="text-base font-semibold text-zinc-900">Lista de tarefas</div>
          <div className="mt-4">
            <Button
              size="xl"
              className="w-full bg-zinc-900 active:bg-zinc-800"
              onClick={startCleaning}
              disabled={isPending}
            >
              {isPending ? "A iniciar…" : "Iniciar limpeza"}
            </Button>
          </div>
        </Card>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}
      </div>
    </div>
  );
}

