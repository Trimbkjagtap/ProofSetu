import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-card border text-base font-medium " +
  "min-h-[44px] px-5 py-2.5 transition-colors focus-visible:outline-none " +
  "disabled:cursor-not-allowed disabled:opacity-60";

const variants: Record<Variant, string> = {
  primary:
    "bg-forest text-paper border-forest hover:bg-forest-dark hover:border-forest-dark",
  secondary:
    "bg-paper text-forest border-line hover:bg-sage hover:border-forest",
  ghost:
    "bg-transparent text-forest border-transparent hover:bg-sage",
  // Red reserved strictly for destructive actions.
  danger:
    "bg-paper text-danger border-danger hover:bg-danger hover:text-paper",
};

/** Shared button. 44px minimum target; visible focus handled globally. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ variant = "primary", className = "", type, ...props }, ref) {
    return (
      <button
        ref={ref}
        type={type ?? "button"}
        className={`${base} ${variants[variant]} ${className}`}
        {...props}
      />
    );
  }
);
