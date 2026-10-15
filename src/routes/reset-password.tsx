import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [
    { title: "Choose a new password — Muslim HQ" },
    { name: "description", content: "Set a new password for your Muslim HQ account." },
    { property: "og:title", content: "Choose a new password — Muslim HQ" },
    { property: "og:description", content: "Set a new password for your Muslim HQ account." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState<"checking" | "ok" | "invalid">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady("ok");
    });
    const isRecovery = window.location.hash.includes("type=recovery") || window.location.search.includes("code=");
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady("ok");
      else if (!isRecovery) setReady("invalid");
      else setTimeout(() => setReady(r => (r === "checking" ? "invalid" : r)), 4000);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { toast.error("Passwords don't match."); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated. Welcome back.");
    navigate({ to: "/dashboard", replace: true });
  }

  const input = "mt-1 w-full px-4 py-2.5 rounded-xl bg-background ring-1 ring-border focus:outline-none focus:ring-[color:var(--gold)]";
  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <div className="w-full max-w-md bg-card ring-1 ring-border rounded-3xl p-8">
        <h1 className="font-serif text-3xl">Choose a new password</h1>
        {ready === "checking" && <p className="mt-4 text-sm text-muted-foreground">Checking your reset link…</p>}
        {ready === "invalid" && (
          <div className="mt-4 text-sm text-muted-foreground">
            <p>This reset link has expired or was already used.</p>
            <Link to="/auth" className="mt-4 inline-block text-[color:var(--sage)] hover:underline">Request a new link</Link>
          </div>
        )}
        {ready === "ok" && (
          <form onSubmit={save} className="mt-6 space-y-4">
            <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">New password
              <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} className={input} />
            </label>
            <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">Confirm password
              <input type="password" required minLength={6} value={confirm} onChange={e => setConfirm(e.target.value)} className={input} />
            </label>
            <button disabled={saving} className="w-full py-3 rounded-full bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">{saving ? "Saving…" : "Save new password"}</button>
          </form>
        )}
      </div>
    </div>
  );
}
