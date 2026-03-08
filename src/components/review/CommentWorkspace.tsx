import { ReviewComment } from "@/types/review";
import { Trash2, Send } from "lucide-react";

interface CommentWorkspaceProps {
  comments: ReviewComment[];
  onRemove: (id: string) => void;
  onShowAI: () => void;
}

const typeLabel = { blocking: "Blocking", question: "Question", suggestion: "Suggestion", note: "Note" };
const typeDot = { blocking: "bg-destructive", question: "bg-warning", suggestion: "bg-success", note: "bg-muted-foreground" };

export function CommentWorkspace({ comments, onRemove, onShowAI }: CommentWorkspaceProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2.5 border-b flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">
          Comments{comments.length > 0 && <span className="text-muted-foreground ml-1.5">{comments.length}</span>}
        </span>
        {comments.length > 0 && (
          <button className="text-[11px] text-foreground hover:text-foreground/70 flex items-center gap-1 transition-colors">
            <Send className="h-3 w-3" strokeWidth={1.5} /> Post all
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-1.5">
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <p className="text-xs text-muted-foreground">Click any line to comment</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="border rounded px-3 py-2 group animate-fade-in">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${typeDot[comment.type]}`} />
                  <span className="text-[10px] text-muted-foreground">{typeLabel[comment.type]}</span>
                  <span className="text-[10px] text-muted-foreground/50 font-mono">
                    {comment.file.split("/").pop()}:{comment.line}
                  </span>
                </div>
                <button
                  onClick={() => onRemove(comment.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                >
                  <Trash2 className="h-3 w-3" strokeWidth={1.5} />
                </button>
              </div>
              <p className="text-xs text-foreground leading-relaxed">{comment.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
