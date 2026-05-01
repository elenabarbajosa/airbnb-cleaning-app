"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ProgressBar } from "@/components/ProgressBar";
import { EvaNoteCard } from "@/components/EvaNoteCard";
import { TaskCard, type TaskCardTask } from "@/components/TaskCard";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Session = {
  id: string;
  status: "in_progress" | "completed";
  eva_note: string | null;
  maid_general_note: string | null;
};

export function PublicCleaningSessionClient({
  token,
  session,
  tasks,
}: {
  token: string;
  session: Session;
  tasks: TaskCardTask[];
}) {
  const router = useRouter();
  const [localTasks, setLocalTasks] = useState<TaskCardTask[]>(tasks);
  const [issueOpen, setIssueOpen] = useState<Record<string, boolean>>({});
  const [generalNote, setGeneralNote] = useState(session.maid_general_note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const completedCount = useMemo(() => localTasks.filter((t) => t.is_completed).length, [localTasks]);
  const progress = localTasks.length ? completedCount / localTasks.length : 0;
  const hasIncomplete = completedCount !== localTasks.length;

  function updateTask(taskId: string, patch: Partial<TaskCardTask>) {
    setLocalTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t)));
  }

  async function saveTask(taskId: string, body: { is_completed?: boolean; issue_note?: string | null }) {
    const res = await fetch(`/api/cleaning/sessions/${token}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
  }

  function toggleCompleted(taskId: string) {
    setError(null);
    const current = localTasks.find((t) => t.id === taskId);
    if (!current) return;
    const next = !current.is_completed;
    updateTask(taskId, { is_completed: next });
    startTransition(async () => {
      try {
        await saveTask(taskId, { is_completed: next });
      } catch (e) {
        updateTask(taskId, { is_completed: current.is_completed });
        setError(e instanceof Error ? e.message : "Não foi possível atualizar a tarefa.");
      }
    });
  }

  function saveIssue(taskId: string, value: string) {
    updateTask(taskId, { issue_note: value });
  }

  function persistIssue(taskId: string) {
    setError(null);
    const value = localTasks.find((t) => t.id === taskId)?.issue_note ?? "";
    startTransition(async () => {
      try {
        await saveTask(taskId, { issue_note: value });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Não foi possível guardar a ocorrência.");
      }
    });
  }

  function saveGeneralNote() {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/cleaning/sessions/${token}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ maid_general_note: generalNote }),
      });
      if (!res.ok) setError(await res.text());
    });
  }

  function completeCleaning() {
    setError(null);
    if (hasIncomplete) {
      const ok = window.confirm("Há tarefas incompletas. Concluir mesmo assim?");
      if (!ok) return;
    }
    startTransition(async () => {
      const res = await fetch(`/api/cleaning/sessions/${token}/complete`, { method: "POST" });
      if (!res.ok) {
        setError(await res.text());
        return;
      }
      router.replace("/cleaning");
      router.refresh();
    });
  }

  return (
    <div className="min-h-[100dvh] w-full bg-[#faf7f2] pb-28">
      <div className="mx-auto w-full max-w-xl space-y-4 px-4 py-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xl font-semibold tracking-tight text-zinc-900">Sessão de limpeza</div>
            <div className="text-sm font-semibold text-zinc-700">
              {completedCount}/{localTasks.length}
            </div>
          </div>
          <ProgressBar value={progress} trackClassName="bg-rose-100" barClassName="bg-rose-500" />
        </div>

        <EvaNoteCard note={session.eva_note} title="Nota da Eva" />

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}

        <div className="space-y-3">
          {localTasks.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              disabled={session.status === "completed"}
              showIssue={Boolean(issueOpen[t.id])}
              onToggleIssue={() => setIssueOpen((m) => ({ ...m, [t.id]: !m[t.id] }))}
              onToggleCompleted={() => toggleCompleted(t.id)}
              onIssueChange={(v) => saveIssue(t.id, v)}
              onIssueBlur={() => persistIssue(t.id)}
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
        </div>

        <Textarea
          label="Nota geral"
          placeholder="Algo que a Eva precise saber?"
          value={generalNote}
          onChange={(e) => setGeneralNote(e.target.value)}
          onBlur={saveGeneralNote}
          disabled={session.status === "completed"}
        />
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-200 bg-[#faf7f2]/95 backdrop-blur">
        <div className={cn("mx-auto w-full max-w-xl px-4 py-4 pb-safe")}>
          <Button
            size="xl"
            className="w-full bg-zinc-900 active:bg-zinc-800"
            onClick={completeCleaning}
            disabled={isPending}
          >
            {isPending ? "A guardar…" : "Concluir limpeza"}
          </Button>
          {hasIncomplete ? (
            <div className="mt-2 text-center text-xs font-medium text-amber-700">
              Tarefas incompletas são permitidas (vamos pedir confirmação).
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

