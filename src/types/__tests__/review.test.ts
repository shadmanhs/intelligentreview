import { describe, it, expect } from "vitest";
import type { AIConcern, ConcernSeverity } from "@/types/review";

describe("AIConcern type", () => {
  it("should support originalDraftComment field", () => {
    const concern: AIConcern = {
      id: "ai-0",
      severity: "warning",
      title: "Test concern",
      explanation: "Test explanation",
      file: "test.ts",
      lineStart: 1,
      lineEnd: 5,
      codeSnippet: "code",
      draftComment: "edited version",
      originalDraftComment: "original version",
      status: "edited",
    };

    expect(concern.originalDraftComment).toBe("original version");
    expect(concern.draftComment).toBe("edited version");
    expect(concern.status).toBe("edited");
  });

  it("should accept all valid severity levels", () => {
    const severities: ConcernSeverity[] = ["critical", "warning", "suggestion", "note"];
    severities.forEach(severity => {
      const concern: AIConcern = {
        id: "1",
        severity,
        title: "test",
        explanation: "test",
        file: "test.ts",
        lineStart: 1,
        lineEnd: 5,
        codeSnippet: "",
        draftComment: "",
        status: "pending",
      };
      expect(concern.severity).toBe(severity);
    });
  });

  it("should accept all valid status values", () => {
    const statuses = ["pending", "approved", "edited", "dismissed"] as const;
    statuses.forEach(status => {
      const concern: AIConcern = {
        id: "1",
        severity: "warning",
        title: "test",
        explanation: "test",
        file: "test.ts",
        lineStart: 1,
        lineEnd: 5,
        codeSnippet: "",
        draftComment: "",
        status,
      };
      expect(concern.status).toBe(status);
    });
  });
});
