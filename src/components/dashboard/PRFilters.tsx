import { ArrowUpDown, Filter, X } from "lucide-react";

export type SortField = "updated" | "size" | "age";
export type SortDir = "asc" | "desc";

interface PRFiltersProps {
  repos: string[];
  selectedRepo: string;
  onRepoChange: (repo: string) => void;
  showDrafts: boolean;
  onToggleDrafts: () => void;
  sortField: SortField;
  sortDir: SortDir;
  onSortChange: (field: SortField) => void;
  totalCount: number;
  filteredCount: number;
}

export function PRFilters({
  repos,
  selectedRepo,
  onRepoChange,
  showDrafts,
  onToggleDrafts,
  sortField,
  sortDir,
  onSortChange,
  totalCount,
  filteredCount,
}: PRFiltersProps) {
  const hasFilters = selectedRepo !== "" || !showDrafts;

  const sortLabels: Record<SortField, string> = {
    updated: "Recently updated",
    size: "Smallest first",
    age: "Oldest first",
  };

  return (
    <div className="flex items-center gap-2 flex-wrap mb-4">
      {/* Sort */}
      <div className="flex items-center gap-1 border rounded-md overflow-hidden">
        {(["updated", "size", "age"] as SortField[]).map((field) => (
          <button
            key={field}
            onClick={() => onSortChange(field)}
            className={`text-[11px] px-2.5 py-1.5 transition-colors ${
              sortField === field
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {field === "updated" ? "Recent" : field === "size" ? "Small" : "Oldest"}
          </button>
        ))}
      </div>

      {/* Repo filter */}
      {repos.length > 1 && (
        <select
          value={selectedRepo}
          onChange={(e) => onRepoChange(e.target.value)}
          className="text-[11px] px-2 py-1.5 border rounded-md bg-transparent text-foreground outline-none cursor-pointer"
        >
          <option value="">All repos</option>
          {repos.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      )}

      {/* Draft toggle */}
      <button
        onClick={onToggleDrafts}
        className={`text-[11px] px-2.5 py-1.5 border rounded-md transition-colors ${
          showDrafts ? "text-muted-foreground hover:text-foreground" : "bg-foreground text-background"
        }`}
      >
        {showDrafts ? "Hide drafts" : "Show drafts"}
      </button>

      {/* Filter count */}
      {filteredCount !== totalCount && (
        <span className="text-[10px] text-muted-foreground ml-auto">
          {filteredCount} of {totalCount}
        </span>
      )}
    </div>
  );
}
