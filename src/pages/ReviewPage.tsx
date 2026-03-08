import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { DiffViewer } from "@/components/review/DiffViewer";
import { FileTree } from "@/components/review/FileTree";
import { ReviewChecklist } from "@/components/review/ReviewChecklist";
import { AISummaryPanel } from "@/components/review/AISummaryPanel";
import { CommentWorkspace } from "@/components/review/CommentWorkspace";
import { mockPRs, mockFiles, defaultChecklist, mockAISummary } from "@/data/mockData";
import { ReviewComment, ChecklistItem } from "@/types/review";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const pr = mockPRs.find((p) => p.id === Number(id));

  const [selectedFile, setSelectedFile] = useState(0);
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(defaultChecklist);
  const [showAI, setShowAI] = useState(true);

  const addComment = (comment: Omit<ReviewComment, "id" | "createdAt">) => {
    setComments((prev) => [
      ...prev,
      { ...comment, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
    ]);
  };

  const removeComment = (id: string) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  const toggleChecklist = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const checklistProgress = useMemo(() => {
    const checked = checklist.filter((c) => c.checked).length;
    return Math.round((checked / checklist.length) * 100);
  }, [checklist]);

  if (!pr) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">PR not found</p>
      </div>
    );
  }

  const currentFile = mockFiles[selectedFile];

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <AppHeader />
      {/* PR Header Bar */}
      <div className="border-b bg-card px-4 py-2.5 flex items-center gap-3 shrink-0">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="h-7 px-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono">{pr.repo}</span>
            <span className="text-xs text-muted-foreground">#{pr.number}</span>
          </div>
          <h2 className="text-sm font-medium text-foreground truncate">{pr.title}</h2>
        </div>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
          <ExternalLink className="h-3 w-3" />
          View on GitHub
        </Button>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar: file tree + checklist */}
        <div className="w-64 border-r bg-card flex flex-col shrink-0 overflow-hidden">
          <FileTree
            files={mockFiles}
            selectedIndex={selectedFile}
            onSelect={setSelectedFile}
          />
          <div className="border-t flex-1 overflow-y-auto scrollbar-thin">
            <ReviewChecklist
              items={checklist}
              onToggle={toggleChecklist}
              progress={checklistProgress}
            />
          </div>
        </div>

        {/* Center: diff + AI panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {showAI && (
            <AISummaryPanel summary={mockAISummary} onClose={() => setShowAI(false)} />
          )}
          <div className="flex-1 overflow-auto scrollbar-thin">
            <DiffViewer file={currentFile} onAddComment={addComment} />
          </div>
        </div>

        {/* Right: comment workspace */}
        <div className="w-80 border-l bg-card shrink-0 overflow-hidden">
          <CommentWorkspace
            comments={comments}
            onRemove={removeComment}
            onShowAI={() => setShowAI(true)}
          />
        </div>
      </div>
    </div>
  );
}
