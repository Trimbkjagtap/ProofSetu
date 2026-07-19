import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Clock,
  HelpCircle,
  PencilLine,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { ChecklistStatus, FieldState } from "@/types/domain";

type Tone = "positive" | "neutral" | "warning" | "danger" | "info" | "corrected";

interface Visual {
  Icon: LucideIcon;
  label: string;
  tone: Tone;
}

/** Every status carries an icon AND text — never color alone (WCAG 1.4.1). */
const toneClasses: Record<Tone, string> = {
  // Confirmed → muted teal
  positive: "bg-[#E4F1ED] text-[#215E52] border-success/45",
  // Missing → gray
  neutral: "bg-blush text-muted border-line",
  // Informational (Extracted) → muted plum/clay
  info: "bg-blush text-clay border-clay/35",
  warning: "bg-[#FBEFD8] text-[#9A5B00] border-warning/50",
  // Expired → red
  danger: "bg-[#F8E4E3] text-danger border-danger/50",
  // Corrected → amber (clearly distinct from teal Confirmed)
  corrected: "bg-[#FBE8CE] text-[#9A5B00] border-warning/60",
};

const checklistVisual: Record<ChecklistStatus, Visual> = {
  present: { Icon: CheckCircle2, label: "Present", tone: "positive" },
  missing: { Icon: CircleDashed, label: "Missing", tone: "neutral" },
  expiring: { Icon: Clock, label: "Expiring", tone: "warning" },
  expired: { Icon: XCircle, label: "Expired", tone: "danger" },
};

const fieldVisual: Record<FieldState, Visual> = {
  unconfirmed: { Icon: HelpCircle, label: "Extracted", tone: "info" },
  confirmed: { Icon: CheckCircle2, label: "Confirmed", tone: "positive" },
  corrected: { Icon: PencilLine, label: "Corrected", tone: "corrected" },
  please_check: { Icon: AlertTriangle, label: "Please check", tone: "warning" },
};

interface StatusBadgeProps {
  kind: "checklist" | "field";
  status: ChecklistStatus | FieldState;
  className?: string;
}

export function StatusBadge({ kind, status, className = "" }: StatusBadgeProps) {
  const visual =
    kind === "checklist"
      ? checklistVisual[status as ChecklistStatus]
      : fieldVisual[status as FieldState];

  if (!visual) return null;
  const { Icon, label, tone } = visual;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-medium transition-colors duration-150 ${toneClasses[tone]} ${className}`}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
