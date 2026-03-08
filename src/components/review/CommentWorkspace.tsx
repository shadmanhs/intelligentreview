import { ReviewComment } from "@/types/review";
import { CommentTypeBadge } from "@/components/CommentTypeBadge";
import { Trash2, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CommentWorkspaceProps {
  comments: ReviewComment[];
  onRemove: (id: string) => void;
  onShowAI: () => void;
}

export function CommentWorkspace({ comments, onRemove, onShowAI }: CommentWorkspaceProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium text-foreground">Draft Comments</p>
          {comments.length > 0 && (
            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
              {comments.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1" onClick={onShowAI}>
            <Sparkles className="h-3 w-3" /> AI
          </Button>
          {comments.length > 0 && (
            <Button size="sm" className="h-7 text-[10px] gap-1">
              <Send className="h-3 w-3" /> Post All
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2">
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <p className="text-xs text-muted-foreground mb-1">No comments yet</p>
            <p className="text-[10px] text-muted-foreground">
              Click on any line in the diff to add a comment
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="border rounded-md p-2.5 bg-background group animate-fade-in"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <CommentTypeBadge type={comment.type} />
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {comment.file.split("/").pop()}:{comment.line}
                  </span>
                </div>
                <button
                  onClick={() => onRemove(comment.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                >
                  <Trash2 className="h-3 w-3" />
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
