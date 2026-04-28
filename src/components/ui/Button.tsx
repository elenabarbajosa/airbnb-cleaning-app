import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "md" | "lg" | "xl";
};

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-zinc-900 text-white active:bg-zinc-800 disabled:bg-zinc-300",
  secondary:
    "bg-white text-zinc-900 border border-zinc-200 active:bg-zinc-50 disabled:text-zinc-400 disabled:bg-zinc-50",
  danger: "bg-red-600 text-white active:bg-red-500 disabled:bg-red-200",
  ghost: "bg-transparent text-zinc-900 active:bg-zinc-100 disabled:text-zinc-400",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  md: "h-11 px-4 text-base rounded-xl",
  lg: "h-12 px-5 text-base rounded-xl",
  xl: "h-14 px-6 text-lg rounded-2xl",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "lg", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold tracking-tight transition select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50",
        "disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
});

