import { type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";

const alertVariants = cva(
  "relative flex gap-3 rounded-md border px-4 py-3 text-sm",
  {
    variants: {
      variant: {
        default: "bg-purple-100 border-purple-300 text-purple-700",
        success: "bg-emerald-50 border-emerald-200 text-emerald-800",
        warning: "bg-amber-50 border-amber-200 text-amber-800",
        danger:  "bg-red-50 border-red-200 text-red-800",
        info:    "bg-blue-50 border-blue-200 text-blue-800",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

const icons: Record<string, typeof AlertCircle> = {
  default: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  danger:  AlertCircle,
  info:    Info,
};

interface AlertProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

function Alert({ className, variant = "default", children, ...props }: AlertProps) {
  const Icon = icons[variant ?? "default"];
  return (
    <div className={cn(alertVariants({ variant }), className)} role="alert" {...props}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex-1">{children}</div>
    </div>
  );
}

export { Alert };
