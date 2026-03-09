import { useState } from "react";
import { Bug, X, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function BugReportButton() {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!description.trim()) return;
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-contact", {
        body: {
          name: user?.email?.split("@")[0] || "Anonymous",
          email: user?.email || "no-email@unknown.com",
          subject: "Bug Report",
          message: `[BUG REPORT]\n\nURL: ${window.location.href}\nUA: ${navigator.userAgent}\n\n${description}`,
        },
      });
      if (error) throw error;
      toast.success("Bug report sent. Thanks for helping us improve!");
      setDescription("");
      setOpen(false);
    } catch {
      toast.error("Failed to send report. Try again later.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 h-9 w-9 rounded-full border bg-card shadow-lg flex items-center justify-center hover:bg-secondary transition-colors group"
        title="Report a bug"
      >
        <Bug className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.5} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-card border rounded-t-xl sm:rounded-xl w-full sm:max-w-md p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bug className="h-4 w-4 text-foreground" strokeWidth={1.5} />
                <h3 className="text-sm font-medium text-foreground">Report a bug</h3>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What went wrong? Be as specific as you can..."
              className="w-full h-28 rounded-md border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring"
              autoFocus
            />
            <div className="flex items-center justify-between mt-3">
              <p className="text-[10px] text-muted-foreground">
                Page URL & browser info will be included automatically.
              </p>
              <button
                onClick={handleSubmit}
                disabled={!description.trim() || sending}
                className="text-xs px-4 py-2 rounded-md bg-foreground text-background font-medium hover:bg-foreground/90 disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                {sending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
