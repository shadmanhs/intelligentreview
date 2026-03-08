import { Badge } from "@/components/ui/badge";

const typeConfig = {
  blocking: { label: "Blocking", className: "bg-destructive/10 text-destructive border-destructive/20" },
  question: { label: "Question", className: "bg-warning/10 text-warning-foreground border-warning/20" },
  suggestion: { label: "Suggestion", className: "bg-success/10 text-success border-success/20" },
  note: { label: "Note", className: "bg-info/10 text-info border-info/20" },
};

export function CommentTypeBadge({ type }: { type: keyof typeof typeConfig }) {
  const config = typeConfig[type];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
