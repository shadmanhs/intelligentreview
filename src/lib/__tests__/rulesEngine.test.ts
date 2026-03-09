import { describe, it, expect } from "vitest";

// Test the structured rule formatting logic (extracted from analyze-pr)
function formatStructuredRule(conditions: any[], severity: string): string {
  const parts = conditions.map((c: any) => {
    switch (c.type) {
      case "max_function_length":
        return `Flag any function longer than ${c.value} lines as ${severity}`;
      case "require_pattern":
        return `Flag files that don't contain "${c.value}" when they match pattern "${c.filePattern}" as ${severity}`;
      case "forbid_pattern":
        return `Flag any usage of "${c.value}" as ${severity}. ${c.reason || ""}`;
      case "require_error_handling":
        return `Flag ${c.value} functions/calls without error handling as ${severity}`;
      case "max_file_length":
        return `Flag any file longer than ${c.value} lines as ${severity}`;
      case "naming_convention":
        return `Enforce ${c.value} naming convention for ${c.target} as ${severity}`;
      default:
        return `Check: ${JSON.stringify(c)}`;
    }
  });
  return parts.join(". ");
}

describe("Rules Engine", () => {
  describe("formatStructuredRule", () => {
    it("should format max_function_length rule", () => {
      const result = formatStructuredRule(
        [{ type: "max_function_length", value: "50" }],
        "warning"
      );
      expect(result).toBe("Flag any function longer than 50 lines as warning");
    });

    it("should format forbid_pattern rule with reason", () => {
      const result = formatStructuredRule(
        [{ type: "forbid_pattern", value: "eval(", reason: "Security risk" }],
        "critical"
      );
      expect(result).toBe('Flag any usage of "eval(" as critical. Security risk');
    });

    it("should format forbid_pattern rule without reason", () => {
      const result = formatStructuredRule(
        [{ type: "forbid_pattern", value: "console.log" }],
        "suggestion"
      );
      expect(result).toBe('Flag any usage of "console.log" as suggestion. ');
    });

    it("should format require_error_handling rule", () => {
      const result = formatStructuredRule(
        [{ type: "require_error_handling", value: "async" }],
        "warning"
      );
      expect(result).toBe("Flag async functions/calls without error handling as warning");
    });

    it("should format max_file_length rule", () => {
      const result = formatStructuredRule(
        [{ type: "max_file_length", value: "300" }],
        "suggestion"
      );
      expect(result).toBe("Flag any file longer than 300 lines as suggestion");
    });

    it("should format naming_convention rule", () => {
      const result = formatStructuredRule(
        [{ type: "naming_convention", value: "camelCase", target: "variables" }],
        "warning"
      );
      expect(result).toBe("Enforce camelCase naming convention for variables as warning");
    });

    it("should format require_pattern rule", () => {
      const result = formatStructuredRule(
        [{ type: "require_pattern", value: "try/catch", filePattern: "*.ts" }],
        "warning"
      );
      expect(result).toBe('Flag files that don\'t contain "try/catch" when they match pattern "*.ts" as warning');
    });

    it("should handle multiple conditions", () => {
      const result = formatStructuredRule(
        [
          { type: "max_function_length", value: "50" },
          { type: "forbid_pattern", value: "eval(", reason: "Security risk" },
        ],
        "critical"
      );
      expect(result).toContain("Flag any function longer than 50 lines as critical");
      expect(result).toContain('Flag any usage of "eval(" as critical. Security risk');
    });

    it("should handle unknown condition types", () => {
      const result = formatStructuredRule(
        [{ type: "custom_check", value: "test" }],
        "note"
      );
      expect(result).toContain("Check:");
    });
  });
});

describe("Learning Loop pattern hash", () => {
  function patternHash(title: string, severity: string): string {
    const normalized = title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 60);
    return `${severity}:${normalized}`;
  }

  it("should normalize titles consistently", () => {
    expect(patternHash("Missing Error Handling", "warning"))
      .toBe(patternHash("missing error handling", "warning"));
  });

  it("should strip special characters", () => {
    expect(patternHash("Missing Error-Handling!", "warning"))
      .toBe(patternHash("Missing Error Handling", "warning"));
  });

  it("should differentiate by severity", () => {
    expect(patternHash("Missing Error Handling", "warning"))
      .not.toBe(patternHash("Missing Error Handling", "critical"));
  });

  it("should truncate long titles", () => {
    const longTitle = "A".repeat(100);
    const hash = patternHash(longTitle, "warning");
    expect(hash.length).toBeLessThanOrEqual(68); // "warning:" + 60 chars
  });
});
