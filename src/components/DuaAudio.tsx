import { useEffect, useRef, useState } from "react";
import { Pause, Play, Repeat, Square } from "lucide-react";

// Reads the dua aloud using the device's built-in voice (Arabic when available).
export function DuaAudio({ arabic, transliteration, translation }: { arabic?: string | null; transliteration?: string | null; translation?: string | null }) {
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [loop, setLoop] = useState(false);
  const [rate, setRate] = useState(0.8);
  const [lang, setLang] = useState<"ar" | "en">(arabic ? "ar" : "en");
  const id = useRef(crypto.randomUUID());
  const loopRef = useRef(loop);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => { loopRef.current = loop; }, [loop]);
  useEffect(() => {
    if (!supported) return;
    const stopOtherPlayer = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== id.current) {
        setPlaying(false);
        setPaused(false);
      }
    };
    window.addEventListener("dua-audio-play", stopOtherPlayer);
    return () => {
      window.removeEventListener("dua-audio-play", stopOtherPlayer);
      window.speechSynthesis.cancel();
    };
  }, [supported]);

  const text = lang === "ar" ? arabic : (translation || transliteration);
  if (!text) return null;

  function speak() {
    if (!text) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    window.dispatchEvent(new CustomEvent("dua-audio-play", { detail: id.current }));
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === "ar" ? "ar-SA" : "en-US";
    u.rate = rate;
    const voice = synth.getVoices().find((v) => v.lang.startsWith(lang));
    if (voice) u.voice = voice;
    u.onend = () => { if (loopRef.current) speak(); else setPlaying(false); };
    u.onerror = () => { setPlaying(false); setPaused(false); };
    synth.speak(u);
    setPlaying(true);
    setPaused(false);
  }

  function togglePause() {
    if (!playing) return speak();
    if (paused) {
      window.speechSynthesis.resume();
      setPaused(false);
    } else {
      window.speechSynthesis.pause();
      setPaused(true);
    }
  }

  function stop() {
    window.speechSynthesis.cancel();
    setPlaying(false);
    setPaused(false);
  }

  function switchLanguage() {
    stop();
    setLang(current => current === "ar" ? "en" : "ar");
  }

  if (!supported) return null;
  return (
    <div className="flex items-center gap-2 text-xs mb-3 rounded-full bg-background ring-1 ring-border px-2 py-1.5 w-fit">
      <button onClick={togglePause} aria-label={!playing ? "Listen" : paused ? "Resume" : "Pause"} title={!playing ? "Listen" : paused ? "Resume" : "Pause"} className="size-7 rounded-full bg-primary text-primary-foreground grid place-items-center">
        {!playing || paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
      </button>
      {playing && <button onClick={stop} aria-label="Stop" title="Stop" className="p-1 text-muted-foreground"><Square className="size-3" /></button>}
      {arabic && (translation || transliteration) && (
        <button onClick={switchLanguage} className="px-2 py-0.5 rounded-full ring-1 ring-border">{lang === "ar" ? "Arabic" : "English"}</button>
      )}
      <button onClick={() => { stop(); setRate(rate === 0.8 ? 0.6 : rate === 0.6 ? 1 : 0.8); }} aria-label="Playback speed" title="Playback speed" className="px-2 py-0.5 rounded-full ring-1 ring-border">{rate}×</button>
      <button onClick={() => setLoop(!loop)} aria-label="Repeat" aria-pressed={loop} title="Repeat" className={`p-1 rounded-full ${loop ? "text-[color:var(--gold)]" : "text-muted-foreground"}`}><Repeat className="size-3.5" /></button>
    </div>
  );
}
