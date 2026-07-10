import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Muslim HQ" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin, data: { name } },
        });
        if (error) throw error;
        toast.success("Welcome. Check your email if confirmation is required.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/dashboard", replace: true });
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally { setLoading(false); }
  }

  async function handleGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { toast.error(result.error.message ?? "Google sign-in failed"); return; }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-xs tracking-[0.2em] uppercase text-[color:var(--sage)] font-medium">Assalamu alaikum</p>
          <h1 className="font-serif text-4xl mt-2">Muslim <span className="text-[color:var(--gold)]">HQ</span></h1>
          <p className="text-sm text-muted-foreground mt-2">Your deen, your pace.</p>
        </div>

        <div className="bg-card ring-1 ring-border rounded-3xl p-8">
          <div className="flex gap-1 p-1 bg-muted rounded-full mb-6 text-sm">
            <button onClick={() => setMode("signin")} className={`flex-1 py-2 rounded-full transition ${mode === "signin" ? "bg-background shadow-sm" : ""}`}>Sign in</button>
            <button onClick={() => setMode("signup")} className={`flex-1 py-2 rounded-full transition ${mode === "signup" ? "bg-background shadow-sm" : ""}`}>Create account</button>
          </div>

          <form onSubmit={handleEmail} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Name</label>
                <input value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-background ring-1 ring-border focus:outline-none focus:ring-[color:var(--gold)]" />
              </div>
            )}
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-background ring-1 ring-border focus:outline-none focus:ring-[color:var(--gold)]" />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Password</label>
              <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-background ring-1 ring-border focus:outline-none focus:ring-[color:var(--gold)]" />
            </div>
            <button disabled={loading} className="w-full py-3 rounded-full bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
              {loading ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
          </div>

          <button onClick={handleGoogle} className="w-full py-3 rounded-full ring-1 ring-border text-sm font-medium hover:bg-muted transition">
            Continue with Google
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Built for consistency, not perfection.
        </p>
      </div>
    </div>
  );
}
