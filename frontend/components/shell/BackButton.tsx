import { ArrowLeft } from "lucide-react";
import { LinkButton } from "@/components/ui/LinkButton";

interface BackButtonProps {
  href: string;
  /** "Back" on normal pages; "Back and edit" on the Packet page. */
  label?: string;
}

/**
 * Visible Back control. Uses client navigation, so all entered, confirmed, and
 * corrected information (held in shared state + sessionStorage) is preserved.
 */
export function BackButton({ href, label = "Back" }: BackButtonProps) {
  return (
    <LinkButton href={href} variant="secondary">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {label}
    </LinkButton>
  );
}
