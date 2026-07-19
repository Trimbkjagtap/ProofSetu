/**
 * Shared button styling so <Button> and <LinkButton> look identical.
 * Hover: a 2px lift + slightly stronger shadow, over a 150ms transition.
 * Reduced motion (OS or the in-app setting) neutralizes the transition globally.
 */
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export const buttonBase =
  "group inline-flex items-center justify-center gap-2 rounded-card border text-base font-medium " +
  "min-h-[44px] px-5 py-2.5 transition-all duration-200 ease-out focus-visible:outline-none " +
  "hover:-translate-y-0.5 active:translate-y-0 " +
  "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none";

export const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-gradient text-white border-transparent shadow-card hover:shadow-raised hover:brightness-[1.06]",
  secondary:
    "bg-paper text-forest border-line hover:bg-sage hover:border-emerald hover:shadow-card",
  ghost: "bg-transparent text-forest border-transparent hover:bg-sage",
  danger:
    "bg-paper text-danger border-danger hover:bg-danger hover:text-white hover:shadow-card",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  className = ""
): string {
  return `${buttonBase} ${buttonVariants[variant]} ${className}`;
}
