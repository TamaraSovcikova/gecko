import { AlertTriangle, Lightbulb, TrendingUp, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "../lib/utils";
import type { Callout } from "../data/calloutConditions";

type Props = {
  callout: Callout;
};

const CONFIG = {
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: AlertTriangle,
    iconColor: "text-amber-500",
    titleColor: "text-amber-900",
    bodyColor: "text-amber-700",
    dismissColor: "text-amber-400 hover:text-amber-600",
  },
  tip: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    icon: Lightbulb,
    iconColor: "text-purple-500",
    titleColor: "text-purple-900",
    bodyColor: "text-purple-700",
    dismissColor: "text-purple-300 hover:text-purple-500",
  },
  insight: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: TrendingUp,
    iconColor: "text-blue-500",
    titleColor: "text-blue-900",
    bodyColor: "text-blue-700",
    dismissColor: "text-blue-300 hover:text-blue-500",
  },
} as const;

export function FinanceCallout({ callout }: Props) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const c = CONFIG[callout.variant];
  const Icon = c.icon;

  return (
    <div className={cn("flex gap-3 rounded-lg border px-3.5 py-3", c.bg, c.border)}>
      <Icon className={cn("w-4 h-4 shrink-0 mt-0.5", c.iconColor)} />
      <div className="flex-1 min-w-0">
        <p className={cn("text-xs font-bold mb-0.5", c.titleColor)}>{callout.title}</p>
        <p className={cn("text-xs leading-relaxed", c.bodyColor)}>{callout.body}</p>
        {callout.learnSlug && (
          <Link
            to={`/learn/concepts/${callout.learnSlug}`}
            className={cn("text-[11px] font-semibold mt-1 inline-block", c.iconColor, "hover:underline")}
          >
            Learn more →
          </Link>
        )}
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className={cn("shrink-0 mt-0.5", c.dismissColor)}
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function FinanceCalloutList({ callouts }: { callouts: Callout[] }) {
  if (!callouts.length) return null;
  return (
    <div className="space-y-2">
      {callouts.map((c) => (
        <FinanceCallout key={c.id} callout={c} />
      ))}
    </div>
  );
}
