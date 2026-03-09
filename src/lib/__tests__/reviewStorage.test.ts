import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      single: vi.fn().mockResolvedValue({ data: { id: "test-session-id" } }),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-123" } } }),
    },
  },
}));

import { saveReviewSession } from "@/lib/reviewStorage";
import type { AIConcern } from "@/types/review";

describe("reviewStorage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("saveReviewSession", () => {
    const baseConcern: AIConcern = {
      id: "ai-0",
      severity: "warning",
      title: "Missing error handling",
      explanation: "This async function lacks try/catch",
      file: "src/api.ts",
      lineStart: 10,
      lineEnd: 15,
      codeSnippet: "async function fetch() {}",
      draftComment: "Add error handling here",
      originalDraftComment: "Add error handling here",
      status: "pending",
    };

    it("should return null if no user is logged in", async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({ data: { user: null }, error: null } as any);

      const result = await saveReviewSession({
        repo: "owner/repo",
        prNumber: 1,
        summary: "test",
        riskLevel: "low",
        concerns: [],
        commentsPosted: 0,
      });

      expect(result).toBeNull();
    });

    it("should correctly count approved/dismissed/edited concerns", async () => {
      const concerns: AIConcern[] = [
        { ...baseConcern, id: "1", status: "approved" },
        { ...baseConcern, id: "2", status: "dismissed" },
        { ...baseConcern, id: "3", status: "edited", draftComment: "Edited comment", originalDraftComment: "Original" },
        { ...baseConcern, id: "4", status: "pending" },
      ];

      const result = await saveReviewSession({
        repo: "owner/repo",
        prNumber: 1,
        summary: "test summary",
        riskLevel: "medium",
        concerns,
        commentsPosted: 2,
      });

      expect(result).toBe("test-session-id");
    });
  });
});
