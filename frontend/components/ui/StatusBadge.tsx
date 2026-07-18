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

type Tone = "positive" | "neutral" | "warning" | "danger" | "info";

interface Visual {
  Icon: LucideIcon;
  label: string;
  tone: Tone;
}

/** Every status carries an icon AND text — never color alone (WCAG 1.4.1). */
const toneClasses: Record<Tone, string> = {
  positive: "bg-sage text-forest-dark border-forest/30",
  neutral: "bg-paper text-muted border-line",
  info: "bg-paper text-citation border-citation/30",
  warning: "bg-[#FBF3E0] text-warning border-warning/40",
  danger: "bg-[#FCEBEA] text-danger border-danger/40",
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
  corrected: { Icon: PencilLine, label: "Corrected", tone: "warning" },
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
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-medium ${toneClasses[tone]} ${className}`}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
