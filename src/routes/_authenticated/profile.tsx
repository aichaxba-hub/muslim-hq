import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Button, Card, PageHeader } from "@/components/AppShell";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getProfile, updateProfile, deleteAccount, resetAllData } from "@/lib/data.functions";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { CALC_METHODS, MADHABS, computeTimes, formatTime, PRAYERS, PRAYER_LABEL } from "@/lib/prayer-times";
import { toast } from "sonner";
import { LocateFixed } from "lucide-react";
import { ReminderSettingsCard } from "@/components/ReminderSettingsCard";

export const Route = createFileRoute("/_authenticated/profile")({
head: () => ({ meta: [
    { title: "Profile & Prayer Settings — Muslim HQ" },
    { name: "description", content: "Set your location, prayer calculation method and madhab for accurate prayer times." },
    { property: "og:title", content: "Profile & Prayer Settings — Muslim HQ" },
    { property: "og:description", content: "Set your location, prayer calculation method and madhab for accurate prayer times." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ProfilePage,
});

function ProfilePage() {
  const qc = useQueryClient();
  const profileFn = useServerFn(getProfile);
  const updateFn = useServerFn(updateProfile);

  const profile = useQuery({ queryKey: ["profile"], queryFn: () => profileFn({ data: undefined as any }) });

  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [locating, setLocating] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [resetText, setResetText] = useState("");
  const navigate = useNavigate();
  const deleteFn = useServerFn(deleteAccount);
  const resetFn = useServerFn(resetAllData);

  const reset = useMutation({
    mutationFn: () => resetFn({ data: undefined as any }),
    onSuccess: () => {
      qc.clear();
      setResetText("");
      toast.success("All your data has been cleared — a fresh start");
    },
    onError: () => toast.error("Could not reset your data — please try again"),
  });

  const del = useMutation({
    mutationFn: () => deleteFn({ data: undefined as any }),
    onSuccess: async () => {
      await supabase.auth.signOut();
      toast.success("Your account and data have been deleted");
      navigate({ to: "/" });
    },
    onError: () => toast.error("Could not delete your account — please try again"),
  });
  const [method, setMethod] = useState("MoonsightingCommittee");
  const [madhab, setMadhab] = useState("shafi");

  useEffect(() => {
    if (!profile.data) return;
    setName(profile.data.display_name ?? "");
    setLabel(profile.data.location_label ?? "");
    setLat(profile.data.latitude != null ? String(profile.data.latitude) : "");
    setMethod(profile.data.calc_method ?? "MoonsightingCommittee");
    setMadhab((profile.data as any).madhab ?? "shafi");
    setLng(profile.data.longitude != null ? String(profile.data.longitude) : "");
  }, [profile.data]);

  const save = useMutation({
    mutationFn: (payload: Record<string, unknown>) => updateFn({ data: payload as any }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile saved");
    },
    onError: () => toast.error("Could not save — please try again"),
  });

  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  const validCoords = Number.isFinite(latNum) && Number.isFinite(lngNum) && Math.abs(latNum) <= 90 && Math.abs(lngNum) <= 180;

  const previewTimes = useMemo(() => {
    if (!validCoords) return null;
    return computeTimes({ latitude: latNum, longitude: lngNum, method, madhab });
  }, [latNum, lngNum, validCoords, method, madhab]);

  function useMyLocation() {
    if (!navigator.geolocation) {
      toast.error("Location is not available in this browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const la = pos.coords.latitude;
        const lo = pos.coords.longitude;
        setLat(la.toFixed(5));
        setLng(lo.toFixed(5));
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${la}&longitude=${lo}&localityLanguage=en`
          );
          if (res.ok) {
            const geo = await res.json();
            const place =
              [geo.city || geo.locality, geo.principalSubdivision, geo.countryName]
                .filter(Boolean)
                .filter((v: string, i: number, arr: string[]) => arr.indexOf(v) === i)
                .join(", ") || geo.formattedAddress;
            if (place) setLabel(place);
          } else if (!label.trim()) {
            setLabel("My location");
          }
        } catch {
          if (!label.trim()) setLabel("My location");
        }
        setLocating(false);
        toast.success("Location found — save to apply it");
      },
      () => {
        setLocating(false);
        toast.error("Could not get your location. You can enter coordinates manually.");
      },
      { timeout: 10000 }
    );
  }

  function handleSave() {
    const payload: Record<string, unknown> = { display_name: name.trim() || null, calc_method: method, madhab };
    if (validCoords) {
      payload.latitude = latNum;
      payload.longitude = lngNum;
      payload.location_label = label.trim() || "My location";
    } else if (lat.trim() || lng.trim()) {
      toast.error("Coordinates look invalid — latitude -90 to 90, longitude -180 to 180");
      return;
    }
    save.mutate(payload);
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Profile"
        title="Your details"
        subtitle="Your name personalizes the app, and your location makes prayer times accurate for where you are."
      />
      <ReminderSettingsCard />

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <h2 className="font-serif text-xl mb-4">Display name</h2>
          <label className="block text-sm text-muted-foreground mb-1.5">What should we call you?</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Aicha"
            className="w-full rounded-xl bg-background ring-1 ring-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--sage)]"
          />
          <p className="text-xs text-muted-foreground mt-2">Used in your dashboard greeting.</p>
        </Card>

        <Card>
          <h2 className="font-serif text-xl mb-4">Location & prayer times</h2>
          <label className="block text-sm text-muted-foreground mb-1.5">Location name</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. New York"
            className="w-full rounded-xl bg-background ring-1 ring-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--sage)] mb-3"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Latitude</label>
              <input
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="40.7128"
                inputMode="decimal"
                className="w-full rounded-xl bg-background ring-1 ring-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--sage)]"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Longitude</label>
              <input
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="-74.0060"
                inputMode="decimal"
                className="w-full rounded-xl bg-background ring-1 ring-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--sage)]"
              />
            </div>
          </div>
          <Button variant="ghost" onClick={useMyLocation} disabled={locating} className="mt-4 inline-flex items-center gap-2">
            <LocateFixed className="size-4" />
            {locating ? "Locating…" : "Use my current location"}
          </Button>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="font-serif text-xl mb-1">Calculation settings</h2>
        <p className="text-xs text-muted-foreground mb-4">Choose what your local masjid follows so your times match.</p>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Calculation method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full rounded-xl bg-background ring-1 ring-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--sage)]">
              {CALC_METHODS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Madhab (Asr time)</label>
            <select value={madhab} onChange={(e) => setMadhab(e.target.value)} className="w-full rounded-xl bg-background ring-1 ring-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--sage)]">
              {MADHABS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {previewTimes && (
        <Card className="mt-6">
          <h2 className="font-serif text-xl mb-1">Today's prayer times{label.trim() ? ` — ${label.trim()}` : ""}</h2>
          <p className="text-xs text-muted-foreground mb-4">Preview based on the coordinates above.</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {PRAYERS.map((p) => (
              <div key={p} className="rounded-2xl bg-background ring-1 ring-border p-4 text-center">
                <p className="text-xs uppercase tracking-widest text-[color:var(--sage)]">{PRAYER_LABEL[p]}</p>
                <p className="font-serif text-lg mt-1">{formatTime(previewTimes[p])}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="mt-8 flex gap-3">
        <Button onClick={handleSave} disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>

      <Card className="mt-10 ring-destructive/40">
        <h2 className="font-serif text-xl mb-1 text-destructive">Delete account</h2>
        <p className="text-sm text-muted-foreground mb-4">
          This permanently deletes your account and all your data — prayer logs, Qada, Quran progress, duas, reflections, goals and Zakat records. This cannot be undone.
        </p>
        <label className="block text-sm text-muted-foreground mb-1.5">Type <span className="font-semibold text-foreground">DELETE</span> to confirm</label>
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="DELETE"
          className="w-full max-w-xs rounded-xl bg-background ring-1 ring-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-destructive mb-3"
        />
        <div>
          <Button
            variant="ghost"
            onClick={() => del.mutate()}
            disabled={confirmText !== "DELETE" || del.isPending}
            className="text-destructive ring-1 ring-destructive/40 hover:bg-destructive/10"
          >
            {del.isPending ? "Deleting…" : "Permanently delete my account"}
          </Button>
        </div>
      </Card>
    </AppShell>
  );
}
