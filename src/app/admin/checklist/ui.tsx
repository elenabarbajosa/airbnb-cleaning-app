"use client";

import { useMemo, useState, useTransition } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { TaskCard, type TaskCardTask } from "@/components/TaskCard";
import { cn } from "@/lib/utils";

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
  const [preview, setPreview] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{
    title: string;
    description: string;
    is_active: boolean;
    is_important: boolean;
  } | null>(null);

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

  const sortedTasks = useMemo(() => tasks.slice().sort((a, b) => a.sort_order - b.sort_order), [tasks]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const previewTasks = useMemo(() => {
    return sortedTasks
      .filter((t) => t.is_active)
      .map(
        (t): TaskCardTask => ({
          id: t.id,
          title: t.title,
          description: t.description,
          is_important: t.is_important,
          is_completed: false,
          issue_note: null,
        }),
      );
  }, [sortedTasks]);

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
        if (editingId === id) {
          setEditingId(null);
          setDraft(null);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo eliminar la tarea.");
      }
    });
  }

  const editingTask = useMemo(() => (editingId ? tasks.find((t) => t.id === editingId) ?? null : null), [editingId, tasks]);

  function startEdit(t: ChecklistTask) {
    setError(null);
    setEditingId(t.id);
    setDraft({
      title: t.title,
      description: t.description ?? "",
      is_active: t.is_active,
      is_important: t.is_important,
    });
  }

  function closeEdit() {
    setEditingId(null);
    setDraft(null);
  }

  function saveEdit() {
    if (!editingTask || !draft) return;
    const next: ChecklistTask = {
      ...editingTask,
      title: draft.title,
      description: draft.description.trim() ? draft.description : null,
      is_active: draft.is_active,
      is_important: draft.is_important,
    };
    updateLocal(editingTask.id, next);
    saveTask(next);
    closeEdit();
  }

  function persistOrder(nextSorted: ChecklistTask[]) {
    // Persist only ordering changes; keep other fields as-is.
    // Use 10-step spacing to reduce future churn.
    const updates = nextSorted.map((t, index) => ({ id: t.id, sort_order: (index + 1) * 10 }));
    setTasks((prev) =>
      prev.map((t) => {
        const u = updates.find((x) => x.id === t.id);
        return u ? { ...t, sort_order: u.sort_order } : t;
      }),
    );

    startTransition(async () => {
      try {
        await Promise.all(
          updates.map((u) =>
            api<{ ok: true }>(`/api/admin/checklist-tasks/${u.id}`, {
              method: "PATCH",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ sort_order: u.sort_order }),
            }),
          ),
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo actualizar el orden.");
      }
    });
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setError(null);
    const ids = sortedTasks.map((t) => t.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(sortedTasks, oldIndex, newIndex);
    persistOrder(next);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="text-2xl font-semibold tracking-tight">Lista de tareas (plantilla)</div>
          <div className="text-sm text-zinc-600">Define el orden y qué se muestra en cada limpieza.</div>
        </div>
        <Button
          type="button"
          variant={preview ? "secondary" : "primary"}
          className={preview ? "w-full sm:w-auto" : "w-full bg-sky-600 active:bg-sky-500 disabled:bg-sky-200 sm:w-auto"}
          onClick={() => setPreview((v) => !v)}
          disabled={isPending}
        >
          {preview ? "Volver a editar" : "Vista previa"}
        </Button>
      </div>

      {preview ? (
        <div className="space-y-3">
          <Card className="border-sky-100 bg-white/95 p-4">
            <div className="text-sm font-semibold text-zinc-900">Vista previa (solo lectura)</div>
            <div className="mt-1 text-sm text-zinc-600">
              Así lo verá la limpiadora. Se muestran solo tareas activas.
            </div>
          </Card>

          <div className="space-y-3">
            {previewTasks.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                disabled
                showIssue={false}
                onToggleIssue={() => {}}
                onToggleCompleted={() => {}}
                onIssueBlur={() => {}}
                onIssueChange={() => {}}
                hideIssueControls
                labels={{
                  importantBadge: "Importante",
                  ariaMarkComplete: "Marcar como concluída",
                  ariaMarkIncomplete: "Marcar como não concluída",
                  hideIssue: "Ocultar ocorrência",
                  editIssue: "Editar ocorrência",
                  addIssue: "Adicionar ocorrência",
                  issueLabel: "Ocorrência",
                  issuePlaceholder: "Algo avariado, falta material, etc.",
                }}
              />
            ))}
            {!previewTasks.length ? (
              <div className="text-sm text-zinc-600">No hay tareas activas para mostrar.</div>
            ) : null}
          </div>
        </div>
      ) : (
        <Card className="p-4">
          <div className="text-base font-semibold">Añadir tarea</div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
            <div className="sm:col-span-2">
              <Input
                label="Título"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="p. ej., Baño"
              />
            </div>
            <Button
              size="lg"
              className="w-full bg-sky-600 active:bg-sky-500 disabled:bg-sky-200"
              onClick={addTask}
              disabled={isPending}
            >
              Añadir
            </Button>
            <div className="sm:col-span-3">
              <Textarea label="Descripción (opcional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
            </div>
          </div>
        </Card>
      )}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      {!preview ? (
        <div className="space-y-2">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={sortedTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              {sortedTasks.map((t, idx) => (
                <SortableTaskRow
                  key={t.id}
                  idx={idx}
                  task={t}
                  isPending={isPending}
                  onEdit={() => startEdit(t)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      ) : null}

      {editingTask && draft ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/20"
            aria-label="Cerrar editor"
            onClick={closeEdit}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-5xl">
            <div className="mx-2 mb-2 rounded-3xl border border-sky-100 bg-white shadow-xl sm:mx-4">
              <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-zinc-900">Editar tarea</div>
                  <div className="truncate text-xs text-zinc-600">{editingTask.title}</div>
                </div>
                <Button type="button" variant="ghost" size="md" onClick={closeEdit}>
                  Cerrar
                </Button>
              </div>

              <div className="space-y-3 px-4 py-4">
                <Input
                  label="Título"
                  value={draft.title}
                  onChange={(e) => setDraft((d) => (d ? { ...d, title: e.target.value } : d))}
                />
                <Textarea
                  label="Descripción"
                  value={draft.description}
                  onChange={(e) => setDraft((d) => (d ? { ...d, description: e.target.value } : d))}
                />

                <div className="flex flex-wrap items-center gap-4">
                  <label className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700">
                    <input
                      type="checkbox"
                      checked={draft.is_active}
                      onChange={(e) => setDraft((d) => (d ? { ...d, is_active: e.target.checked } : d))}
                      className="h-5 w-5 accent-sky-600"
                    />
                    Activa
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700">
                    <input
                      type="checkbox"
                      checked={draft.is_important}
                      onChange={(e) => setDraft((d) => (d ? { ...d, is_important: e.target.checked } : d))}
                      className="h-5 w-5 accent-sky-600"
                    />
                    Importante
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-2 border-t border-zinc-200 px-4 py-4 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="danger"
                  className="w-full bg-red-600/90 active:bg-red-600 disabled:bg-red-200 sm:w-auto"
                  onClick={() => deleteTask(editingTask.id)}
                  disabled={isPending}
                >
                  Eliminar
                </Button>
                <Button
                  type="button"
                  className="w-full bg-sky-600 active:bg-sky-500 disabled:bg-sky-200 sm:w-auto"
                  onClick={saveEdit}
                  disabled={isPending}
                >
                  Guardar
                </Button>
              </div>
            </div>
            <div className="pb-safe" />
          </div>
        </>
      ) : null}
    </div>
  );
}

function SortableTaskRow({
  task,
  idx,
  isPending,
  onEdit,
}: {
  task: ChecklistTask;
  idx: number;
  isPending: boolean;
  onEdit: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-2xl border border-zinc-200 bg-white px-3 py-2 shadow-sm",
        isDragging ? "opacity-90 ring-2 ring-sky-300" : null,
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-sky-100 bg-sky-50 text-[11px] font-bold text-sky-900">
          {idx + 1}
        </div>

        <button
          type="button"
          className={cn(
            "h-10 w-10 shrink-0 rounded-xl border border-zinc-200 bg-white text-zinc-700",
            "active:bg-zinc-50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
          )}
          aria-label="Arrastrar para reordenar"
          title="Arrastrar para reordenar"
          disabled={isPending}
          {...attributes}
          {...listeners}
        >
          ≡
        </button>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-zinc-900 leading-5 break-words">{task.title}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {task.is_active ? (
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                Activa
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                Inactiva
              </span>
            )}
            {task.is_important ? (
              <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                Importante
              </span>
            ) : null}
          </div>
        </div>

        <Button type="button" variant="secondary" size="md" className="h-10 px-3" onClick={onEdit} disabled={isPending}>
          Editar
        </Button>
      </div>
    </div>
  );
}

