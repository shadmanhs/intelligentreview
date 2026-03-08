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

  const removeComment = (id: string) => setComments((prev) => prev.filter((c) => c.id !== id));

  const toggleChecklist = (id: string) => {
    setChecklist((prev) => prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)));
  };

  const checklistProgress = useMemo(() => {
    const checked = checklist.filter((c) => c.checked).length;
    return Math.round((checked / checklist.length) * 100);
  }, [checklist]);

  if (!pr) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">PR not found</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <AppHeader />

      {/* PR bar */}
      <div className="border-b px-4 py-2 flex items-center gap-3 shrink-0">
        <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <div className="flex-1 min-w-0">
          <span className="text-[11px] text-muted-foreground font-mono">{pr.repo} #{pr.number}</span>
          <h2 className="text-sm font-medium text-foreground truncate">{pr.title}</h2>
        </div>
        <button className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
          <ExternalLink className="h-3 w-3" strokeWidth={1.5} /> GitHub
        </button>
      </div>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        <div className="w-56 border-r flex flex-col shrink-0 overflow-hidden">
          <FileTree files={mockFiles} selectedIndex={selectedFile} onSelect={setSelectedFile} />
          <div className="border-t flex-1 overflow-y-auto scrollbar-thin">
            <ReviewChecklist items={checklist} onToggle={toggleChecklist} progress={checklistProgress} />
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {showAI && <AISummaryPanel summary={mockAISummary} onClose={() => setShowAI(false)} />}
          <div className="flex-1 overflow-auto scrollbar-thin">
            <DiffViewer file={mockFiles[selectedFile]} onAddComment={addComment} />
          </div>
        </div>

        <div className="w-72 border-l shrink-0 overflow-hidden">
          <CommentWorkspace comments={comments} onRemove={removeComment} onShowAI={() => setShowAI(true)} />
        </div>
      </div>
    </div>
  );
}
