import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Moon, Sun, LogOut } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const NAV = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/worship", label: "Worship" },
  { to: "/qada", label: "Qada" },
  { to: "/quran", label: "Quran" },
  { to: "/fasting", label: "Fasting" },
  { to: "/dhikr", label: "Dhikr" },
  { to: "/duas", label: "Duas" },
  { to: "/goals", label: "Goals" },
  { to: "/reflections", label: "Reflect" },
  { to: "/zakat", label: "Zakat" },
  { to: "/review", label: "Review" },
  { to: "/reset", label: "Reset" },
] as const;

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    return (localStorage.getItem("mhq-theme") as "light" | "dark") || "light";
  });
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("mhq-theme", theme);
  }, [theme]);
  return { theme, toggle: () => setTheme(t => t === "light" ? "dark" : "light") };
}

export function AppShell({ children }: { children: ReactNode }) {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between gap-4">
          <Link to="/dashboard" className="font-serif text-2xl tracking-tight">
            Muslim <span className="text-[color:var(--gold)]">HQ</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-1 text-sm">
            {NAV.map(n => (
              <Link key={n.to} to={n.to}
                className="px-3 py-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                activeProps={{ className: "px-3 py-1.5 rounded-full bg-primary text-primary-foreground" }}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="size-9 rounded-full ring-1 ring-border grid place-items-center hover:bg-muted transition-colors" aria-label="Toggle theme">
              {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
            </button>
            <button onClick={signOut} className="size-9 rounded-full ring-1 ring-border grid place-items-center hover:bg-muted transition-colors" aria-label="Sign out">
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
        <nav className="lg:hidden max-w-6xl mx-auto px-4 pb-3 flex gap-1 overflow-x-auto text-xs">
          {NAV.map(n => (
            <Link key={n.to} to={n.to}
              className="whitespace-nowrap px-3 py-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
              activeProps={{ className: "whitespace-nowrap px-3 py-1.5 rounded-full bg-primary text-primary-foreground" }}>
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">{children}</main>
      <footer className="text-center text-xs text-muted-foreground py-8">
        Your deen, your pace. One prayer at a time.
      </footer>
    </div>
  );
}

export function PageHeader({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-8">
      {eyebrow && <p className="text-xs tracking-[0.2em] uppercase text-[color:var(--sage)] font-medium mb-2">{eyebrow}</p>}
      <h1 className="text-3xl md:text-4xl font-serif leading-tight">{title}</h1>
      {subtitle && <p className="text-muted-foreground mt-2 max-w-2xl">{subtitle}</p>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl bg-card ring-1 ring-border p-6 ${className}`}>{children}</div>;
}

export function Button({ children, variant = "primary", ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "gold" }) {
  const base = "px-5 py-2.5 rounded-full text-sm font-medium transition-colors disabled:opacity-50";
  const styles = {
    primary: "bg-primary text-primary-foreground hover:opacity-90",
    ghost: "ring-1 ring-border hover:bg-muted",
    gold: "bg-[color:var(--gold)] text-white hover:opacity-90",
  }[variant];
  return <button {...rest} className={`${base} ${styles} ${rest.className ?? ""}`}>{children}</button>;
}
