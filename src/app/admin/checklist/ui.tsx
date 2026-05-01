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
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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

  function normalizeOrder(list: ChecklistTask[]) {
    return [...list].sort((a, b) => a.sort_order - b.sort_order);
  }

  function moveTask(id: string, dir: -1 | 1) {
    setTasks((prev) => {
      const sorted = normalizeOrder(prev);
      const idx = sorted.findIndex((t) => t.id === id);
      const nextIdx = idx + dir;
      if (idx < 0 || nextIdx < 0 || nextIdx >= sorted.length) return prev;
      const a = sorted[idx]!;
      const b = sorted[nextIdx]!;
      const aOrder = a.sort_order;
      const bOrder = b.sort_order;
      return normalizeOrder(
        sorted.map((t) =>
          t.id === a.id ? { ...t, sort_order: bOrder } : t.id === b.id ? { ...t, sort_order: aOrder } : t,
        ),
      );
    });
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
      <div className="space-y-1">
        <div className="text-2xl font-semibold tracking-tight">Lista de tareas (plantilla)</div>
        <div className="text-sm text-zinc-600">Define el orden y qué se muestra en cada limpieza.</div>
      </div>

      <Card className="p-4">
        <div className="text-base font-semibold">Añadir tarea</div>
        <div className="mt-3 space-y-3">
          <Input
            label="Título"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="p. ej., Baño"
          />
          <Textarea label="Descripción (opcional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
          <Button
            size="lg"
            className="w-full bg-sky-600 active:bg-sky-500 disabled:bg-sky-200 sm:w-auto"
            onClick={addTask}
            disabled={isPending}
          >
            Añadir
          </Button>
        </div>
      </Card>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="space-y-3">
        {tasks
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((t, idx) => {
            const isOpen = Boolean(expanded[t.id]);
            return (
              <Card key={t.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sm font-bold text-sky-900 border border-sky-100">
                      {idx + 1}
                    </div>
                    <div className="mt-2 flex flex-col gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        className="h-10 w-10 px-0"
                        onClick={() => moveTask(t.id, -1)}
                        disabled={isPending || idx === 0}
                        aria-label="Subir"
                        title="Subir"
                      >
                        ↑
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        className="h-10 w-10 px-0"
                        onClick={() => moveTask(t.id, 1)}
                        disabled={isPending || idx === tasks.length - 1}
                        aria-label="Bajar"
                        title="Bajar"
                      >
                        ↓
                      </Button>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                      <div className="min-w-0 flex-1">
                        <Input
                          label="Título"
                          value={t.title}
                          onChange={(e) => updateLocal(t.id, { title: e.target.value })}
                        />
                      </div>
                      <div className="sm:w-40">
                        <Input
                          label="Orden"
                          type="number"
                          inputMode="numeric"
                          value={String(t.sort_order)}
                          onChange={(e) => updateLocal(t.id, { sort_order: Number(e.target.value || 0) })}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <label className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700">
                        <input
                          type="checkbox"
                          checked={t.is_active}
                          onChange={(e) => updateLocal(t.id, { is_active: e.target.checked })}
                          className="h-5 w-5 accent-sky-600"
                        />
                        Activa
                      </label>
                      <label className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700">
                        <input
                          type="checkbox"
                          checked={t.is_important}
                          onChange={(e) => updateLocal(t.id, { is_important: e.target.checked })}
                          className="h-5 w-5 accent-sky-600"
                        />
                        Importante
                      </label>

                      <Button
                        type="button"
                        variant="ghost"
                        size="md"
                        className="ml-auto"
                        onClick={() => setExpanded((m) => ({ ...m, [t.id]: !m[t.id] }))}
                      >
                        {isOpen ? "Ocultar descripción" : t.description?.trim() ? "Ver/editar descripción" : "Añadir descripción"}
                      </Button>
                    </div>

                    {isOpen ? (
                      <Textarea
                        label="Descripción"
                        value={t.description ?? ""}
                        onChange={(e) => updateLocal(t.id, { description: e.target.value })}
                      />
                    ) : t.description?.trim() ? (
                      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
                        <div className="font-semibold text-zinc-900">Descripción</div>
                        <div className="mt-1 whitespace-pre-wrap">{t.description}</div>
                      </div>
                    ) : null}

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                      <Button variant="secondary" className="w-full sm:w-auto" onClick={() => saveTask(t)} disabled={isPending}>
                        Guardar
                      </Button>
                      <Button
                        variant="danger"
                        className="w-full bg-red-600/90 active:bg-red-600 disabled:bg-red-200 sm:w-auto"
                        onClick={() => deleteTask(t.id)}
                        disabled={isPending}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
      </div>
    </div>
  );
}

