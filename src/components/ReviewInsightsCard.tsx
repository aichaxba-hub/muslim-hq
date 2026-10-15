import { useState } from "react";
import { useServerFn } from "@/lib/use-app-server-fn";
import { Sparkles } from "lucide-react";
import { Card } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { getReviewInsights, type ReviewInsights } from "@/lib/review-insights.functions";

export function ReviewInsightsCard({ period, stats, ready }: { period: string; stats: Record<string, unknown>; ready: boolean }) {
  const fn = useServerFn(getReviewInsights);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReviewInsights | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forPeriod, setForPeriod] = useState("");

  const run = async () => {
    setLoading(true); setError(null);
    try {
      const r = await fn({ data: { period, stats } });
      if (r.error) setError(r.error); else { setResult(r.insights); setForPeriod(period); }
    } catch { setError("Insights couldn't load. Please try again."); }
    finally { setLoading(false); }
  };

  const Section = ({ title, items }: { title: string; items: string[] }) => items.length ? (
    <div>
      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{title}</div>
      <ul className="space-y-2">{items.map((t, i) => <li key={i} className="text-sm leading-relaxed">• {t}</li>)}</ul>
    </div>
  ) : null;

  return (
    <Card className="mb-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[color:var(--gold)]" />
          <div>
            <h2 className="font-display text-xl">Your reflection companion</h2>
            <p className="text-sm text-muted-foreground">Gentle insights, praise and small next steps from your {period} data.</p>
          </div>
        </div>
        <Button onClick={run} disabled={loading || !ready}>
          {loading ? "Reflecting…" : result ? "Refresh insights" : "Get insights"}
        </Button>
      </div>
      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      {result && (
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <Section title="Masha'Allah" items={result.praise} />
          <Section title="What we noticed" items={result.insights} />
          <Section title="Small next steps" items={result.recommendations} />
          {result.encouragement && (
            <p className="md:col-span-3 border-t border-[color:var(--sand)] pt-4 text-sm italic">
              {result.encouragement}{forPeriod !== period && " (from your earlier period — refresh for this one)"}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
