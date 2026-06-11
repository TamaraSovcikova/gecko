import { type HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  variant?: "default" | "success" | "warning" | "danger" | "gold";
  showLabel?: boolean;
  label?: string;
  size?: "sm" | "md" | "lg";
}

const trackColors: Record<string, string> = {
  default: "bg-purple-200",
  success: "bg-emerald-100",
  warning: "bg-amber-100",
  danger:  "bg-red-100",
  gold:    "bg-amber-100",
};

const fillColors: Record<string, string> = {
  default: "bg-purple-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger:  "bg-red-500",
  gold:    "bg-gold",
};

const heights: Record<string, string> = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

function Progress({
  value,
  max = 100,
  variant = "default",
  showLabel = false,
  label,
  size = "md",
  className,
  ...props
}: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn("w-full", className)} {...props}>
      {(showLabel || label) && (
        <div className="flex justify-between mb-1">
          {label && <span className="text-xs font-medium text-gecko-muted">{label}</span>}
          {showLabel && <span className="text-xs font-semibold text-purple-600">{Math.round(pct)}%</span>}
        </div>
      )}
      <div className={cn("w-full rounded-pill overflow-hidden", heights[size], trackColors[variant])}>
        <div
          className={cn("h-full rounded-pill transition-all duration-500 ease-out", fillColors[variant])}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
}

export { Progress };
