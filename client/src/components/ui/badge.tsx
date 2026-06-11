import { type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-pill px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:  "bg-purple-200 text-purple-700 border border-purple-300",
        primary:  "bg-purple-600 text-white",
        success:  "bg-emerald-100 text-emerald-700 border border-emerald-200",
        warning:  "bg-amber-100 text-amber-700 border border-amber-200",
        danger:   "bg-red-100 text-red-700 border border-red-200",
        gold:     "bg-amber-50 text-amber-700 border border-amber-200",
        outline:  "bg-transparent border border-purple-300 text-purple-600",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
