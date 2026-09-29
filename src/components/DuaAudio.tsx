import { useEffect, useState } from "react";
import { Pause, Play, Repeat } from "lucide-react";

// Reads the dua aloud using the device's built-in voice (Arabic when available).
export function DuaAudio({ arabic, transliteration, translation }: { arabic?: string | null; transliteration?: string | null; translation?: string | null }) {
  const [playing, setPlaying] = useState(false);
  const [loop, setLoop] = useState(false);
  const [rate, setRate] = useState(0.8);
  const [lang, setLang] = useState<"ar" | "en">(arabic ? "ar" : "en");
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => () => { if (supported && playing) window.speechSynthesis.cancel(); }, [playing, supported]);

  const text = lang === "ar" ? arabic : (translation || transliteration);
  if (!text) return null;

  function speak() {
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text!);
    u.lang = lang === "ar" ? "ar-SA" : "en-US";
    u.rate = rate;
    const voice = synth.getVoices().find((v) => v.lang.startsWith(lang));
    if (voice) u.voice = voice;
    u.onend = () => { if (loopRef.current) speak(); else setPlaying(false); };
    u.onerror = () => setPlaying(false);
    synth.speak(u);
    setPlaying(true);
  }
  const loopRef = { get current() { return loop; } };

  function toggle() {
    if (playing) { window.speechSynthesis.cancel(); setPlaying(false); } else speak();
  }

  if (!supported) return null;
  return (
    <div className="flex items-center gap-2 text-xs mb-3 rounded-full bg-background ring-1 ring-border px-2 py-1.5 w-fit">
      <button onClick={toggle} aria-label={playing ? "Stop" : "Listen"} className="size-7 rounded-full bg-primary text-primary-foreground grid place-items-center">
        {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
      </button>
      {arabic && (translation || transliteration) && (
        <button onClick={() => setLang(lang === "ar" ? "en" : "ar")} className="px-2 py-0.5 rounded-full ring-1 ring-border">{lang === "ar" ? "Arabic" : "English"}</button>
      )}
      <button onClick={() => setRate(rate === 0.8 ? 0.6 : rate === 0.6 ? 1 : 0.8)} className="px-2 py-0.5 rounded-full ring-1 ring-border">{rate}×</button>
      <button onClick={() => setLoop(!loop)} aria-label="Repeat" className={`p-1 rounded-full ${loop ? "text-[color:var(--gold)]" : "text-muted-foreground"}`}><Repeat className="size-3.5" /></button>
    </div>
  );
}
