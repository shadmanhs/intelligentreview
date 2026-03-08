export interface PR {
  id: number;
  number: number;
  title: string;
  author: string;
  authorAvatar: string;
  repo: string;
  status: "open" | "closed" | "merged";
  draft: boolean;
  additions: number;
  deletions: number;
  changedFiles: number;
  createdAt: string;
  updatedAt: string;
  labels: string[];
  reviewers: string[];
  description: string;
}

export interface FileChange {
  path: string;
  language: string;
  additions: number;
  deletions: number;
  status: "added" | "modified" | "deleted" | "renamed";
  oldContent: string;
  newContent: string;
}

export interface ReviewComment {
  id: string;
  file: string;
  line: number;
  content: string;
  type: "blocking" | "question" | "suggestion" | "note";
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  category: string;
  label: string;
  checked: boolean;
}

export type RiskLevel = "low" | "medium" | "high";

export interface AISummary {
  summary: string;
  keyChanges: { category: string; items: string[] }[];
  riskLevel: RiskLevel;
  riskReasons: string[];
  missingElements: {
    type: "warning" | "info" | "error";
    message: string;
    file: string;
    line?: number;
  }[];
}
