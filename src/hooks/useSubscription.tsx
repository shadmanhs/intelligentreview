import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const FREE_REVIEWS_PER_WEEK = 1;

interface SubscriptionContextType {
  subscribed: boolean;
  loading: boolean;
  subscriptionEnd: string | null;
  reviewsUsedThisWeek: number;
  reviewsRemaining: number;
  recordUsage: (repo: string, prNumber: number) => Promise<void>;
  checkSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  subscribed: false,
  loading: true,
  subscriptionEnd: null,
  reviewsUsedThisWeek: 0,
  reviewsRemaining: FREE_REVIEWS_PER_WEEK,
  recordUsage: async () => {},
  checkSubscription: async () => {},
});

export const useSubscription = () => useContext(SubscriptionContext);

function getStartOfWeek(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, session } = useAuth();
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [reviewsUsedThisWeek, setReviewsUsedThisWeek] = useState(0);

  const fetchUsage = useCallback(async () => {
    if (!user) return;
    const weekStart = getStartOfWeek();
    const { count, error } = await supabase
      .from("usage_tracking")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("review_date", weekStart);
    if (!error && count !== null) {
      setReviewsUsedThisWeek(count);
    }
  }, [user]);

  const recordUsage = useCallback(async (repo: string, prNumber: number) => {
    if (!user) return;
    await supabase.from("usage_tracking").insert({
      user_id: user.id,
      pr_repo: repo,
      pr_number: prNumber,
    });
    await fetchUsage();
  }, [user, fetchUsage]);

  const checkSubscription = useCallback(async () => {
    if (!session) {
      setSubscribed(false);
      setLoading(false);
      return;
    }

    // Timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      setSubscribed(data?.subscribed || false);
      setSubscriptionEnd(data?.subscription_end || null);
    } catch (err) {
      console.error("Failed to check subscription:", err);
      setSubscribed(false);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      checkSubscription();
      fetchUsage();
    } else {
      setSubscribed(false);
      setLoading(false);
      setReviewsUsedThisWeek(0);
    }
  }, [session, checkSubscription, fetchUsage]);

  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      checkSubscription();
      fetchUsage();
    }, 60_000);
    return () => clearInterval(interval);
  }, [session, checkSubscription, fetchUsage]);

  const reviewsRemaining = subscribed
    ? Infinity
    : Math.max(0, FREE_REVIEWS_PER_WEEK - reviewsUsedThisWeek);

  return (
    <SubscriptionContext.Provider
      value={{
        subscribed,
        loading,
        subscriptionEnd,
        reviewsUsedThisWeek,
        reviewsRemaining,
        recordUsage,
        checkSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export { FREE_REVIEWS_PER_WEEK };
