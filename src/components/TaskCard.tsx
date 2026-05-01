import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

export type TaskCardTask = {
  id: string;
  title: string;
  description: string | null;
  is_important: boolean;
  is_completed: boolean;
  issue_note: string | null;
};

type Labels = {
  importantBadge: string;
  ariaMarkIncomplete: string;
  ariaMarkComplete: string;
  hideIssue: string;
  editIssue: string;
  addIssue: string;
  issueLabel: string;
  issuePlaceholder: string;
};

const defaultLabels: Labels = {
  importantBadge: "Importante",
  ariaMarkIncomplete: "Marcar como incompleta",
  ariaMarkComplete: "Marcar como completada",
  hideIssue: "Ocultar incidencia",
  editIssue: "Editar incidencia",
  addIssue: "Añadir incidencia",
  issueLabel: "Incidencia",
  issuePlaceholder: "Algo roto, falta material, etc.",
};

export function TaskCard({
  task,
  onToggleCompleted,
  onIssueChange,
  onIssueBlur,
  showIssue,
  onToggleIssue,
  disabled,
  labels,
}: {
  task: TaskCardTask;
  onToggleCompleted: () => void;
  onToggleIssue: () => void;
  showIssue: boolean;
  onIssueChange: (value: string) => void;
  onIssueBlur: () => void;
  disabled?: boolean;
  labels?: Partial<Labels>;
}) {
  const t = { ...defaultLabels, ...(labels ?? {}) };
  return (
    <Card
      className={cn(
        "p-4",
        task.is_completed ? "border-emerald-200 bg-emerald-50" : "border-zinc-200 bg-white",
      )}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={onToggleCompleted}
          className={cn(
            "mt-0.5 h-10 w-10 shrink-0 rounded-2xl border-2 transition",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300",
            task.is_completed ? "border-emerald-600 bg-emerald-600" : "border-zinc-300 bg-white",
            disabled ? "opacity-60" : "active:scale-[0.98]",
          )}
          aria-label={task.is_completed ? t.ariaMarkIncomplete : t.ariaMarkComplete}
        >
          {task.is_completed ? <div className="text-white text-lg leading-10 font-bold">✓</div> : null}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="text-base font-semibold leading-6 text-zinc-900">{task.title}</div>
            {task.is_important ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                {t.importantBadge}
              </span>
            ) : null}
          </div>
          {task.description ? (
            <div className="mt-1 text-sm leading-6 text-zinc-600">{task.description}</div>
          ) : null}

          <div className="mt-3">
            <Button type="button" variant="secondary" size="md" onClick={onToggleIssue} disabled={disabled}>
              {showIssue ? t.hideIssue : task.issue_note ? t.editIssue : t.addIssue}
            </Button>
          </div>
        </div>
      </div>

      {showIssue ? (
        <div className="mt-3">
          <Textarea
            label={t.issueLabel}
            placeholder={t.issuePlaceholder}
            value={task.issue_note ?? ""}
            onChange={(e) => onIssueChange(e.target.value)}
            onBlur={onIssueBlur}
            disabled={disabled}
          />
        </div>
      ) : null}
    </Card>
  );
}

