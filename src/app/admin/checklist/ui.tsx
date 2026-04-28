"use client";

import { useMemo, useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

export type ChecklistTask = {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  is_important: boolean;
};

export function ChecklistEditor({ initialTasks }: { initialTasks: ChecklistTask[] }) {
  const [tasks, setTasks] = useState<ChecklistTask[]>(initialTasks);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const nextSort = useMemo(() => (tasks.length ? Math.max(...tasks.map((t) => t.sort_order)) + 1 : 1), [tasks]);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  async function api<T>(path: string, init: RequestInit): Promise<T> {
    const res = await fetch(path, init);
    if (!res.ok) throw new Error(await res.text());
    return (await res.json()) as T;
  }

  function updateLocal(id: string, patch: Partial<ChecklistTask>) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function addTask() {
    setError(null);
    if (!newTitle.trim()) return;
    startTransition(async () => {
      try {
        const created = await api<ChecklistTask>("/api/admin/checklist-tasks", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title: newTitle.trim(),
            description: newDesc.trim() || null,
            sort_order: nextSort,
            is_active: true,
            is_important: false,
          }),
        });

        setTasks((prev) => [...prev, created].sort((a, b) => a.sort_order - b.sort_order));
        setNewTitle("");
        setNewDesc("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo añadir la tarea.");
      }
    });
  }

  function saveTask(task: ChecklistTask) {
    setError(null);
    startTransition(async () => {
      try {
        await api<{ ok: true }>(`/api/admin/checklist-tasks/${task.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(task),
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo guardar la tarea.");
      }
    });
  }

  function deleteTask(id: string) {
    setError(null);
    const ok = window.confirm("¿Eliminar esta tarea?");
    if (!ok) return;
    startTransition(async () => {
      try {
        await api<{ ok: true }>(`/api/admin/checklist-tasks/${id}`, { method: "DELETE" });
        setTasks((prev) => prev.filter((t) => t.id !== id));
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo eliminar la tarea.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="text-2xl font-semibold tracking-tight">Lista de tareas (plantilla)</div>

      <Card className="p-4">
        <div className="text-base font-semibold">Añadir tarea</div>
        <div className="mt-3 space-y-3">
          <Input
            label="Título"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="p. ej., Baño"
          />
          <Textarea
            label="Descripción (opcional)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
          />
          <Button size="lg" onClick={addTask} disabled={isPending}>
            Añadir
          </Button>
        </div>
      </Card>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="space-y-3">
        {tasks.map((t) => (
          <Card key={t.id} className="p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Título"
                value={t.title}
                onChange={(e) => updateLocal(t.id, { title: e.target.value })}
              />
              <Input
                label="Orden"
                type="number"
                inputMode="numeric"
                value={String(t.sort_order)}
                onChange={(e) => updateLocal(t.id, { sort_order: Number(e.target.value || 0) })}
              />
            </div>
            <div className="mt-3">
              <Textarea
                label="Descripción"
                value={t.description ?? ""}
                onChange={(e) => updateLocal(t.id, { description: e.target.value })}
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-4">
              <label className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700">
                <input
                  type="checkbox"
                  checked={t.is_active}
                  onChange={(e) => updateLocal(t.id, { is_active: e.target.checked })}
                  className="h-5 w-5"
                />
                Activa
              </label>
              <label className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700">
                <input
                  type="checkbox"
                  checked={t.is_important}
                  onChange={(e) => updateLocal(t.id, { is_important: e.target.checked })}
                  className="h-5 w-5"
                />
                Importante
              </label>

              <div className="ml-auto flex gap-2">
                <Button variant="secondary" onClick={() => saveTask(t)} disabled={isPending}>
                  Guardar
                </Button>
                <Button variant="danger" onClick={() => deleteTask(t.id)} disabled={isPending}>
                  Eliminar
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

