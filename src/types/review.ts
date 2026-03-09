export interface PR {
  id: number;
  number: number;
  title: string;
  author: string;
  repo: string;
  status: "open" | "closed" | "merged";
  draft: boolean;
  additions: number;
  deletions: number;
  changedFiles: number;
  createdAt: string;
  updatedAt: string;
  labels: string[];
  description: string;
  riskLevel: RiskLevel;
  estimatedMinutes: number;
}

export type RiskLevel = "low" | "medium" | "high";

export type ConcernSeverity = "critical" | "warning" | "suggestion" | "note";

export interface AIConcern {
  id: string;
  severity: ConcernSeverity;
  title: string;
  explanation: string;
  file: string;
  lineStart: number;
  lineEnd: number;
  codeSnippet: string;
  draftComment: string;
  originalDraftComment?: string;
  status: "pending" | "approved" | "edited" | "dismissed";
}

export interface ReviewSession {
  pr: PR;
  summary: string;
  concerns: AIConcern[];
  contextNotes: string[];
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
