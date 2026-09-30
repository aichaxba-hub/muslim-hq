import { useEffect, useRef, useState } from "react";
import { Check, LoaderCircle, Mic, MicOff, RotateCcw, Save, WandSparkles } from "lucide-react";
import { Button, Card } from "@/components/AppShell";

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: { transcript: string };
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionErrorEventLike = { error: string };

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const MATCHERS = [
  {
    category: "SubhanAllah",
    patterns: [/سبحان الله/g, /\bsubhan\s*(?:allah|allahumma)\b/g],
  },
  {
    category: "Alhamdulillah",
    patterns: [/الحمد لله/g, /\bal\s*hamdu\s*lillah\b/g, /\balhamdulillah\b/g],
  },
  {
    category: "Allahu Akbar",
    patterns: [/الله اكبر/g, /\ballahu?\s*akbar\b/g],
  },
  {
    category: "La ilaha illa Allah",
    patterns: [/لا اله الا الله/g, /\bla\s*ilaha\s*ill?a\s*allah\b/g],
  },
  {
    category: "Astaghfirullah",
    patterns: [/استغفر الله/g, /\bastaghfir\s*ullah\b/g, /\bastagfirullah\b/g],
  },
  {
    category: "Salawat",
    patterns: [/اللهم صل(?:ي)? على محمد/g, /\ballahumma\s*salli\s*(?:ala|al[aā])\s*muhammad\b/g],
  },
] as const;

function normalizeTranscript(value: string) {
  return value
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findMatches(transcript: string) {
  const normalized = normalizeTranscript(transcript);
  const matches: string[] = [];

  for (const matcher of MATCHERS) {
    for (const pattern of matcher.patterns) {
      const occurrences = normalized.match(pattern)?.length ?? 0;
      for (let index = 0; index < occurrences; index += 1) matches.push(matcher.category);
    }
  }

  return matches;
}

export function VoiceDhikrCounter({
  onUseCount,
  onSaveSession,
}: {
  onUseCount: (count: number, category?: string) => void;
  onSaveSession: (count: number, category: string) => Promise<void>;
}) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const keepListeningRef = useRef(false);
  const countedByResultRef = useRef(new Map<number, number>());
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [count, setCount] = useState(0);
  const [detected, setDetected] = useState<string>();
  const [heard, setHeard] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSupported(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
    return () => {
      keepListeningRef.current = false;
      recognitionRef.current?.stop();
    };
  }, []);

  function stopListening() {
    keepListeningRef.current = false;
    recognitionRef.current?.stop();
    setListening(false);
  }

  async function startListening() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setSupported(false);
      return;
    }

    setError("");
    setSaved(false);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser cannot access your microphone. Try Chrome, Edge, or Safari.");
      return;
    }

    try {
      const permissionStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      permissionStream.getTracks().forEach(track => track.stop());
    } catch {
      setError("Microphone access is blocked. Allow it in your browser settings, then try again.");
      return;
    }

    keepListeningRef.current = true;
    countedByResultRef.current.clear();
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "ar-SA";
    recognition.onresult = event => {
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result?.[0]?.transcript?.trim() ?? "";
        const matches = findMatches(transcript);
        const alreadyCounted = countedByResultRef.current.get(index) ?? 0;
        const newMatches = Math.max(0, matches.length - alreadyCounted);
        if (newMatches > 0) {
          countedByResultRef.current.set(index, alreadyCounted + newMatches);
          setCount(current => current + newMatches);
          setDetected(matches[matches.length - 1]);
          setSaved(false);
        }
        setHeard(transcript);
      }
    };
    recognition.onerror = event => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setError("Microphone access is blocked. Allow it in your browser settings, then try again.");
        keepListeningRef.current = false;
      } else if (event.error !== "no-speech" && event.error !== "aborted") {
        setError("Voice recognition paused. Check your connection and try again.");
      }
      setListening(false);
    };
    recognition.onend = () => {
      if (keepListeningRef.current) {
        try {
          countedByResultRef.current.clear();
          recognition.start();
          setListening(true);
        } catch {
          keepListeningRef.current = false;
          setListening(false);
        }
      } else {
        setListening(false);
      }
    };
    recognitionRef.current = recognition;

    try {
      recognition.start();
      setListening(true);
    } catch {
      keepListeningRef.current = false;
      setError("Voice recognition could not start. Please try again.");
    }
  }

  function reset() {
    countedByResultRef.current.clear();
    setCount(0);
    setDetected(undefined);
    setHeard("");
    setError("");
    setSaved(false);
  }

  async function saveSession() {
    if (count === 0 || !detected) return;
    setSaving(true);
    setError("");
    try {
      await onSaveSession(count, detected);
      setSaved(true);
    } catch {
      setError("Your session could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="mb-6">
      <div>
        <div>
          <p className="text-xs uppercase tracking-widest text-[color:var(--sage)] mb-2">Voice counter</p>
          <h2 className="font-serif text-2xl">Count as you recite</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Your voice stays in your browser. Speak one phrase at a time for the clearest count.
          </p>
        </div>
      </div>

      <div className="mt-6 grid md:grid-cols-[180px_1fr] gap-5 items-center">
        <div className="text-center md:border-r md:border-border md:pr-5">
          <p className="text-6xl font-serif tabular-nums">{count}</p>
          <p className="text-xs text-muted-foreground mt-1">recognized recitations</p>
        </div>
        <div className="min-w-0">
          <div className="min-h-14 rounded-2xl bg-muted/60 px-4 py-3">
            <p className="text-xs text-muted-foreground mb-1">{listening ? "Microphone active · counting live" : "Last heard"}</p>
            <p className="truncate" dir="auto">{heard || "—"}</p>
          </div>
          {detected && <p className="text-sm mt-2">Detected: <span className="font-medium text-[color:var(--sage)]">{detected}</span></p>}
        </div>
      </div>

      {!supported && (
        <p className="mt-4 text-sm text-destructive">Voice counting is not supported by this browser. Try Chrome or Edge, or use the tap counter.</p>
      )}
      {error && <p className="mt-4 text-sm text-destructive" role="alert">{error}</p>}

      <div className="flex flex-wrap gap-2 mt-5">
        <Button type="button" variant={listening ? "gold" : "primary"} disabled={!supported} onClick={listening ? stopListening : startListening}>
          {listening ? <><MicOff className="size-4 inline mr-2" />Stop listening</> : <><Mic className="size-4 inline mr-2" />Start listening</>}
        </Button>
        <Button type="button" variant="ghost" disabled={count === 0} onClick={() => onUseCount(count, detected)}>
          <WandSparkles className="size-4 inline mr-2" />Use count
        </Button>
        <Button type="button" variant="ghost" disabled={count === 0 || !detected || saving || saved} onClick={saveSession}>
          {saving ? <LoaderCircle className="size-4 inline mr-2 animate-spin" /> : saved ? <Check className="size-4 inline mr-2" /> : <Save className="size-4 inline mr-2" />}
          {saving ? "Saving" : saved ? "Saved" : "Save session"}
        </Button>
        <Button type="button" variant="ghost" disabled={count === 0 && !heard} onClick={reset} aria-label="Reset voice counter">
          <RotateCcw className="size-4 inline mr-2" />Reset
        </Button>
      </div>
    </Card>
  );
}