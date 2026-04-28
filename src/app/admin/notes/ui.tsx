"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

export function NextNoteEditor({ noteId, initialNote }: { noteId: string | null; initialNote: string }) {
  const [note, setNote] = useState(initialNote);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/admin/next-note", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: noteId, note }),
      });
      if (!res.ok) setError(await res.text());
    });
  }

  return (
    <div className="space-y-4">
      <div className="text-2xl font-semibold tracking-tight">Nota para la próxima limpieza</div>
      <Card className="p-4 space-y-3">
        <Textarea
          label="Nota de Eva (se copiará en la próxima sesión)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="p. ej., Por favor, revisa bien la ventana del balcón."
        />
        <Button size="lg" onClick={save} disabled={isPending}>
          {isPending ? "Guardando…" : "Guardar nota"}
        </Button>
        {error ? <div className="text-sm text-red-700">{error}</div> : null}
      </Card>
    </div>
  );
}

