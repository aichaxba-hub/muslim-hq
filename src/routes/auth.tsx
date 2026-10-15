import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
head: () => ({ meta: [
    { title: "Sign in — Muslim HQ" },
    { name: "description", content: "Sign in to Muslim HQ — your calm, private Islamic life dashboard." },
    { property: "og:title", content: "Sign in — Muslim HQ" },
    { property: "og:description", content: "Sign in to Muslim HQ — your calm, private Islamic life dashboard." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [sentTo, setSentTo] = useState<{ email: string; kind: "confirm" | "reset" } | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);
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
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setSentTo({ email, kind: "reset" });
        return;
      }
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/auth`, data: { name } },
        });
        if (error) throw error;
        if (!data.session) { setSentTo({ email, kind: "confirm" }); return; }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (/not confirmed/i.test(error.message)) { setNeedsConfirm(true); throw new Error("Please confirm your email first — we can resend the link."); }
          throw error;
        }
      }
      navigate({ to: "/dashboard", replace: true });
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally { setLoading(false); }
  }

  async function resendConfirmation(target: string) {
    const { error } = await supabase.auth.resend({ type: "signup", email: target, options: { emailRedirectTo: `${window.location.origin}/auth` } });
    if (error) toast.error(error.message); else toast.success("Confirmation email sent again.");
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

        {sentTo ? (
          <div className="bg-card ring-1 ring-border rounded-3xl p-8 text-center">
            <h2 className="font-serif text-2xl">Check your email</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {sentTo.kind === "confirm"
                ? <>We sent a confirmation link to <strong className="text-foreground">{sentTo.email}</strong>. Tap it to activate your account, then you'll be signed in here.</>
                : <>We sent a password reset link to <strong className="text-foreground">{sentTo.email}</strong>. It opens a page where you can choose a new password.</>}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">Can't find it? Check your spam folder.</p>
            <div className="mt-6 flex flex-col gap-2">
              {sentTo.kind === "confirm" && <button onClick={() => resendConfirmation(sentTo.email)} className="w-full py-3 rounded-full ring-1 ring-border text-sm font-medium hover:bg-muted transition">Resend confirmation email</button>}
              <button onClick={() => { setSentTo(null); setMode("signin"); }} className="w-full py-3 rounded-full bg-primary text-primary-foreground text-sm font-medium">Back to sign in</button>
            </div>
          </div>
        ) : (
        <div className="bg-card ring-1 ring-border rounded-3xl p-8">
          {mode === "forgot" && <p className="mb-6 text-sm text-muted-foreground">Enter your email and we'll send you a link to choose a new password.</p>}
          <div hidden={mode === "forgot"} className="flex gap-1 p-1 bg-muted rounded-full mb-6 text-sm">
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
            {mode !== "forgot" && (
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Password</label>
                  {mode === "signin" && <button type="button" onClick={() => setMode("forgot")} className="text-xs text-[color:var(--sage)] hover:underline">Forgot password?</button>}
                </div>
                <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-background ring-1 ring-border focus:outline-none focus:ring-[color:var(--gold)]" />
              </div>
            )}
            <button disabled={loading} className="w-full py-3 rounded-full bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
              {loading ? "Please wait..." : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
            </button>
            {mode === "signin" && needsConfirm && email && (
              <button type="button" onClick={() => resendConfirmation(email)} className="w-full text-xs text-[color:var(--sage)] hover:underline">Resend confirmation email</button>
            )}
            {mode === "forgot" && (
              <button type="button" onClick={() => setMode("signin")} className="w-full text-xs text-muted-foreground hover:underline">Back to sign in</button>
            )}
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
          </div>

          <button onClick={handleGoogle} className="w-full py-3 rounded-full ring-1 ring-border text-sm font-medium hover:bg-muted transition">
            Continue with Google
          </button>
        </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-6">
          Built for consistency, not perfection.
        </p>
      </div>
    </div>
  );
}
