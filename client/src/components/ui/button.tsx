import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-pill font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 cursor-pointer",
  {
    variants: {
      variant: {
        primary:   "bg-purple-600 text-white border border-purple-700 shadow-button hover:bg-purple-500 hover:-translate-y-px active:translate-y-0",
        secondary: "bg-purple-200 text-purple-700 border border-purple-300 hover:bg-purple-300 hover:-translate-y-px",
        ghost:     "bg-transparent text-purple-600 border border-transparent hover:bg-purple-200 hover:border-purple-300",
        outline:   "bg-white text-purple-600 border border-purple-300 hover:bg-purple-100 hover:-translate-y-px",
        danger:    "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100",
        gold:      "bg-gold text-white border border-gold-deep shadow-button hover:opacity-90 hover:-translate-y-px",
        link:      "bg-transparent text-purple-600 underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm:   "text-xs px-3 py-1.5 h-7",
        md:   "text-sm px-4 py-2 h-9",
        lg:   "text-sm px-5 py-2.5 h-11",
        xl:   "text-base px-6 py-3 h-12",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-r-transparent animate-spin" />
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
export { Button, buttonVariants };
