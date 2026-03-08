import { ChecklistItem } from "@/types/review";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";

interface ReviewChecklistProps {
  items: ChecklistItem[];
  onToggle: (id: string) => void;
  progress: number;
}

export function ReviewChecklist({ items, onToggle, progress }: ReviewChecklistProps) {
  const categories = [...new Set(items.map((i) => i.category))];

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-3 px-1">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          Review Checklist
        </p>
        <span className="text-[10px] text-muted-foreground">{progress}%</span>
      </div>
      <Progress value={progress} className="h-1 mb-3" />

      {categories.map((cat) => (
        <div key={cat} className="mb-3">
          <p className="text-[10px] font-medium text-foreground mb-1.5 px-1">{cat}</p>
          <div className="space-y-1">
            {items
              .filter((i) => i.category === cat)
              .map((item) => (
                <label
                  key={item.id}
                  className="flex items-start gap-2 px-1 py-1 rounded hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={item.checked}
                    onCheckedChange={() => onToggle(item.id)}
                    className="mt-0.5 h-3.5 w-3.5"
                  />
                  <span className={`text-[11px] leading-tight ${item.checked ? "text-muted-foreground line-through" : "text-foreground"}`}>
                    {item.label}
                  </span>
                </label>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
