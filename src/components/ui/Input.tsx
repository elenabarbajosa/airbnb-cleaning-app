import * as React from "react";
import { cn } from "@/lib/utils";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Input = React.forwardRef<HTMLInputElement, Props>(function Input(
  { className, label, hint, error, id, ...props },
  ref,
) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  return (
    <div className="space-y-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-zinc-700">
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          "h-12 w-full rounded-xl border px-4 text-base outline-none",
          "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400",
          "focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200",
          error ? "border-red-300 focus:border-red-400 focus:ring-red-100" : null,
          className,
        )}
        {...props}
      />
      {error ? (
        <div className="text-sm text-red-700">{error}</div>
      ) : hint ? (
        <div className="text-sm text-zinc-500">{hint}</div>
      ) : null}
    </div>
  );
});

