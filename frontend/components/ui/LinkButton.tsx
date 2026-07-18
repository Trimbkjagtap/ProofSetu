import Link from "next/link";
import type { ComponentProps } from "react";
import { buttonClasses, type ButtonVariant } from "./buttonStyles";

type LinkButtonProps = ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
};

/** A next/link styled exactly like <Button>, for navigation actions. */
export function LinkButton({
  variant = "primary",
  className = "",
  ...props
}: LinkButtonProps) {
  return <Link className={buttonClasses(variant, className)} {...props} />;
}
