import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LocateFixed } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/AppShell";
import { updateProfile } from "@/lib/data.functions";
import { CALC_METHODS, MADHABS } from "@/lib/prayer-times";

export function OnboardingDialog({ initial }: { initial: { location_label?: string | null; latitude?: number | null; longitude?: number | null; calc_method?: string | null; madhab?: string | null; zakat_anniversary?: string | null } }) {
  const qc = useQueryClient();
  const updateFn = useServerFn(updateProfile);
  const [f, setF] = useState({
    location_label: initial.location_label ?? "", latitude: initial.latitude ?? null as number | null, longitude: initial.longitude ?? null as number | null,
    calc_method: initial.calc_method ?? "MoonsightingCommittee", madhab: initial.madhab ?? "shafi", zakat_anniversary: initial.zakat_anniversary ?? "",
  });
  const [locating, setLocating] = useState(false);
  const save = useMutation({
    mutationFn: (skip: boolean) => updateFn({ data: skip ? { onboarding_complete: true } : {
      onboarding_complete: true, calc_method: f.calc_method, madhab: f.madhab,
      zakat_anniversary: f.zakat_anniversary || null,
      ...(f.latitude != null && f.longitude != null ? { latitude: f.latitude, longitude: f.longitude, location_label: f.location_label || "Your location" } : {}),
    } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["profile"] }); toast.success("You're all set. Bismillah."); },
    onError: () => toast.error("Could not save your settings"),
  });

  function detect() {
    if (!navigator.geolocation) return toast.error("Location isn't available on this device");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude, longitude } = pos.coords;
      let label = "Your location";
      try {
        const r = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
        const j = await r.json();
        label = [j.city || j.locality, j.principalSubdivision, j.countryName].filter(Boolean).join(", ") || label;
      } catch { /* keep default label */ }
      setF(cur => ({ ...cur, latitude, longitude, location_label: label }));
      setLocating(false);
    }, () => { setLocating(false); toast.error("Location permission was declined"); }, { enableHighAccuracy: true, timeout: 15000 });
  }

  const field = "mt-1 w-full h-11 rounded-xl bg-background px-3 ring-1 ring-border";
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-card p-6 ring-1 ring-border shadow-xl">
        <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--sage)]">Welcome to Muslim HQ</p>
        <h2 id="onboarding-title" className="font-serif text-3xl mt-1">Let's set up your prayer times</h2>
        <p className="text-sm text-muted-foreground mt-1">Three quick things so everything is accurate for you.</p>

        <div className="mt-5 space-y-4">
          <div>
            <p className="text-sm font-medium">1. Your city</p>
            <div className="mt-1 flex gap-2">
              <input aria-label="City or location" placeholder="Detect to set your city" value={f.location_label} onChange={e => setF({ ...f, location_label: e.target.value })} className={field + " mt-0"} />
              <Button type="button" variant="ghost" onClick={detect} disabled={locating} className="shrink-0"><LocateFixed className="mr-1 inline size-4" />{locating ? "Finding…" : "Detect"}</Button>
            </div>
            {f.latitude != null && <p className="mt-1 text-xs text-muted-foreground">Located at {f.latitude.toFixed(3)}, {f.longitude?.toFixed(3)}</p>}
          </div>
          <label className="block text-sm font-medium">2. Calculation method
            <select value={f.calc_method} onChange={e => setF({ ...f, calc_method: e.target.value })} className={field}>{CALC_METHODS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}</select>
          </label>
          <label className="block text-sm font-medium">Madhab (for Asr)
            <select value={f.madhab} onChange={e => setF({ ...f, madhab: e.target.value })} className={field}>{MADHABS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}</select>
          </label>
          <label className="block text-sm font-medium">3. Zakat anniversary <span className="font-normal text-muted-foreground">(optional)</span>
            <input type="date" value={f.zakat_anniversary} onChange={e => setF({ ...f, zakat_anniversary: e.target.value })} className={field} />
          </label>
        </div>

        <div className="mt-6 flex flex-wrap justify-between gap-2">
          <Button variant="ghost" onClick={() => save.mutate(true)} disabled={save.isPending}>Skip for now</Button>
          <Button onClick={() => save.mutate(false)} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save & begin"}</Button>
        </div>
      </div>
    </div>
  );
}
