import { forwardRef, type ButtonHTMLAttributes } from "react";
import { buttonClasses, type ButtonVariant } from "./buttonStyles";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

/** Shared button. 44px minimum target; visible focus handled globally. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ variant = "primary", className = "", type, ...props }, ref) {
    return (
      <button
        ref={ref}
        type={type ?? "button"}
        className={buttonClasses(variant, className)}
        {...props}
      />
    );
  }
);
