import { cn } from "@/lib/utils";
import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const VARIANT_STYLES = {
  primary:   "bg-accent-default hover:bg-accent-hover text-accent-fg border-transparent shadow-[0_0_24px_-8px_rgba(34,211,191,0.6)]",
  secondary: "bg-bg-elevated hover:bg-bg-hover text-text-primary border-border-default",
  ghost:     "bg-transparent hover:bg-white/5 text-text-primary border-transparent",
};

const SIZE_STYLES = {
  sm: "h-8 px-3 text-label-md gap-1.5 rounded-sm",
  md: "h-10 px-4 text-label-lg gap-2 rounded-md",
  lg: "h-12 px-6 text-body-md gap-2 rounded-md",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-semibold border transition-all duration-150",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-default focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base",
          VARIANT_STYLES[variant],
          SIZE_STYLES[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
