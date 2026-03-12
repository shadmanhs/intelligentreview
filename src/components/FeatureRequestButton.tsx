import { useState } from "react";
import { Lightbulb, X, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function FeatureRequestButton() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-contact", {
        body: {
          name: user?.email?.split("@")[0] || "Anonymous",
          email: user?.email || "no-email@unknown.com",
          subject: "Feature Request",
          message: `[FEATURE REQUEST]\n\nTitle: ${title}\n\n${description || "(No additional details)"}`,
        },
      });
      if (error) throw error;
      toast.success("Feature request submitted — thank you!");
      setTitle("");
      setDescription("");
      setOpen(false);
    } catch {
      toast.error("Failed to send. Try again later.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-14 z-50 h-9 w-9 rounded-full border bg-card shadow-lg flex items-center justify-center hover:bg-secondary transition-colors group"
        title="Request a feature"
      >
        <Lightbulb className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.5} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-card border rounded-t-xl sm:rounded-xl w-full sm:max-w-md p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-foreground" strokeWidth={1.5} />
                <h3 className="text-sm font-medium text-foreground">Request a feature</h3>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Feature title"
              className="w-full rounded-md border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring mb-2"
              autoFocus
              maxLength={120}
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you'd like and why (optional)"
              className="w-full h-24 rounded-md border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring"
              maxLength={1000}
            />
            <div className="flex items-center justify-between mt-3">
              <p className="text-[10px] text-muted-foreground">
                We read every request.
              </p>
              <button
                onClick={handleSubmit}
                disabled={!title.trim() || sending}
                className="text-xs px-4 py-2 rounded-md bg-foreground text-background font-medium hover:bg-foreground/90 disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                {sending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
