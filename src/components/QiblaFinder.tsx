import { useEffect, useState } from "react";
import { Compass } from "lucide-react";
import { Card, Button } from "@/components/AppShell";

const KAABA = { lat: 21.4225, lng: 39.8262 };

export function qiblaBearing(lat: number, lng: number) {
  const r = Math.PI / 180;
  const dLng = (KAABA.lng - lng) * r;
  const y = Math.sin(dLng);
  const x = Math.cos(lat * r) * Math.tan(KAABA.lat * r) - Math.sin(lat * r) * Math.cos(dLng);
  return (Math.atan2(y, x) / r + 360) % 360;
}

type OrientationEvt = DeviceOrientationEvent & { webkitCompassHeading?: number };

export function QiblaFinder({ latitude, longitude, hasLocation }: { latitude: number; longitude: number; hasLocation: boolean }) {
  const bearing = qiblaBearing(latitude, longitude);
  const [heading, setHeading] = useState<number | null>(null);
  const [state, setState] = useState<"idle" | "active" | "denied" | "unsupported">("idle");

  useEffect(() => {
    if (state !== "active") return;
    const handler = (e: Event) => {
      const ev = e as OrientationEvt;
      const h = typeof ev.webkitCompassHeading === "number" ? ev.webkitCompassHeading : ev.alpha != null ? (360 - ev.alpha) % 360 : null;
      if (h != null) setHeading(h);
    };
    const evtName = "ondeviceorientationabsolute" in window ? "deviceorientationabsolute" : "deviceorientation";
    window.addEventListener(evtName, handler);
    return () => window.removeEventListener(evtName, handler);
  }, [state]);

  async function start() {
    if (typeof DeviceOrientationEvent === "undefined") return setState("unsupported");
    const req = (DeviceOrientationEvent as any).requestPermission;
    if (typeof req === "function") {
      // iOS requires a user gesture for permission — request it on first tap anywhere on the card.
      try { if ((await req()) !== "granted") return setState("denied"); } catch { return setState("denied"); }
    }
    setState("active");
  }

  // Auto-start the compass on devices that don't need a permission gesture.
  useEffect(() => {
    if (state !== "idle") return;
    if (typeof DeviceOrientationEvent === "undefined") { setState("unsupported"); return; }
    if (typeof (DeviceOrientationEvent as any).requestPermission === "function") return; // needs a tap (iOS)
    setState("active");
  }, [state]);

  const rotation = heading == null ? bearing : bearing - heading;
  const aligned = heading != null && Math.abs(((rotation % 360) + 540) % 360 - 180) < 5;

  return (
    <Card className="mb-8">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="relative size-40 shrink-0 rounded-full ring-1 ring-border bg-muted" aria-label={`Qibla is ${Math.round(bearing)} degrees from north`} role="img">
          {["N", "E", "S", "W"].map((d, i) => (
            <span key={d} className="absolute text-[10px] text-muted-foreground" style={{ left: "50%", top: "50%", transform: `rotate(${i * 90 - (heading ?? 0)}deg) translateY(-68px) rotate(${-(i * 90 - (heading ?? 0))}deg) translate(-50%, -50%)` }}>{d}</span>
          ))}
          <div className="absolute inset-0 transition-transform duration-200" style={{ transform: `rotate(${rotation}deg)` }}>
            <div className={`absolute left-1/2 top-3 h-16 w-1.5 -translate-x-1/2 rounded-full ${aligned ? "bg-[color:var(--gold)]" : "bg-primary"}`} />
            <div className="absolute left-1/2 top-1 size-3 -translate-x-1/2 rotate-45 bg-[color:var(--gold)]" />
          </div>
          <div className="absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground" />
        </div>
        <div className="text-center sm:text-left">
          <p className="mb-1 flex items-center justify-center sm:justify-start gap-2 text-xs uppercase tracking-widest text-[color:var(--sage)]"><Compass className="size-4" /> Qibla</p>
          <p className="font-serif text-3xl">{Math.round(bearing)}° from north</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {!hasLocation ? "Using Makkah as a placeholder — set your location in Profile." :
              state === "active" ? (heading == null ? "Move your phone in a figure-eight to calibrate." : aligned ? "You are facing the Qibla." : "Turn until the arrow points straight up.") :
              state === "denied" ? "Motion access was declined. Use the degree reading with any compass." :
              state === "unsupported" ? "This device has no compass sensor. Use the degree reading." :
              "Hold your phone flat and start the live compass."}
          </p>
          {state !== "active" && <Button className="mt-3" onClick={start}>Start live compass</Button>}
        </div>
      </div>
    </Card>
  );
}
