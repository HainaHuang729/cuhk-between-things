type StatusBadgeProps = {
  label: string;
  tone?: "green" | "amber" | "gray" | "red";
};

export function StatusBadge({ label, tone = "gray" }: StatusBadgeProps) {
  return <span className={`statusBadge statusBadge-${tone}`}>{label}</span>;
}
