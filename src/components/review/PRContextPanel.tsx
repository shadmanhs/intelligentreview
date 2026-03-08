import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getGitHubToken } from "@/lib/github";
import { User, GitBranch, Tag, FileText, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

interface PRContextPanelProps {
  owner: string;
  repo: string;
  prNumber: number;
}

interface PRDetail {
  title: string;
  body: string;
  author: string;
  authorAvatar: string;
  baseBranch: string;
  headBranch: string;
  labels: { name: string; color: string }[];
  createdAt: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  linkedIssues: string[];
}

export function PRContextPanel({ owner, repo, prNumber }: PRContextPanelProps) {
  const [detail, setDetail] = useState<PRDetail | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPRDetail();
  }, [owner, repo, prNumber]);

  const loadPRDetail = async () => {
    try {
      const token = await getGitHubToken();
      if (!token) return;

      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
        { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } }
      );
      if (!res.ok) return;
      const pr = await res.json();

      // Extract linked issue refs from body
      const issueRefs: string[] = [];
      if (pr.body) {
        const issuePattern = /(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)/gi;
        let match;
        while ((match = issuePattern.exec(pr.body)) !== null) {
          issueRefs.push(`#${match[1]}`);
        }
      }

      setDetail({
        title: pr.title,
        body: pr.body || "",
        author: pr.user?.login || "unknown",
        authorAvatar: pr.user?.avatar_url || "",
        baseBranch: pr.base?.ref || "main",
        headBranch: pr.head?.ref || "",
        labels: (pr.labels || []).map((l: any) => ({ name: l.name, color: l.color })),
        createdAt: pr.created_at,
        additions: pr.additions || 0,
        deletions: pr.deletions || 0,
        changedFiles: pr.changed_files || 0,
        linkedIssues: issueRefs,
      });
    } catch (err) {
      console.error("Failed to load PR detail:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !detail) return null;

  return (
    <div className="border-b">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-3 flex items-center justify-between text-left hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <FileText className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
          <span className="text-xs font-medium text-foreground">PR Description</span>
          {detail.labels.length > 0 && (
            <div className="flex items-center gap-1">
              {detail.labels.slice(0, 3).map((label) => (
                <span
                  key={label.name}
                  className="text-[9px] px-1.5 py-px rounded-full border text-muted-foreground"
                >
                  {label.name}
                </span>
              ))}
            </div>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
        )}
      </button>

      {expanded && (
        <div className="px-6 pb-4 animate-fade-in">
          {/* Author + branch info */}
          <div className="flex items-center gap-4 mb-3 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              {detail.authorAvatar && (
                <img src={detail.authorAvatar} alt="" className="h-4 w-4 rounded-full" />
              )}
              <span className="font-medium text-foreground">{detail.author}</span>
            </div>
            <div className="flex items-center gap-1">
              <GitBranch className="h-3 w-3" strokeWidth={1.5} />
              <span className="font-mono">{detail.headBranch}</span>
              <span>→</span>
              <span className="font-mono">{detail.baseBranch}</span>
            </div>
            {detail.linkedIssues.length > 0 && (
              <div className="flex items-center gap-1">
                <Tag className="h-3 w-3" strokeWidth={1.5} />
                {detail.linkedIssues.map((issue) => (
                  <a
                    key={issue}
                    href={`https://github.com/${owner}/${repo}/issues/${issue.slice(1)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground hover:underline font-mono"
                  >
                    {issue}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* PR body */}
          {detail.body ? (
            <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap border rounded-md p-3 bg-card max-h-40 overflow-y-auto scrollbar-thin">
              {detail.body.slice(0, 1500)}
              {detail.body.length > 1500 && (
                <a
                  href={`https://github.com/${owner}/${repo}/pull/${prNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:underline inline-flex items-center gap-1 ml-1"
                >
                  …read more <ExternalLink className="h-2.5 w-2.5" strokeWidth={1.5} />
                </a>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground/60 italic">No description provided.</p>
          )}
        </div>
      )}
    </div>
  );
}
