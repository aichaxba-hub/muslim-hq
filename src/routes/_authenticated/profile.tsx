import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Button, Card, PageHeader } from "@/components/AppShell";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getProfile, updateProfile } from "@/lib/data.functions";
import { CALC_METHODS, MADHABS, computeTimes, formatTime, PRAYERS, PRAYER_LABEL } from "@/lib/prayer-times";
import { toast } from "sonner";
import { LocateFixed } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Muslim HQ" }] }),
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
      (pos) => {
        setLat(pos.coords.latitude.toFixed(5));
        setLng(pos.coords.longitude.toFixed(5));
        if (!label.trim()) setLabel("My location");
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
    </AppShell>
  );
}
