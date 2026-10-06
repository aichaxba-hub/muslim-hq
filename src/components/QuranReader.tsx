import { useQuery } from "@tanstack/react-query";
import { BookOpen, ChevronDown, ChevronLeft, ChevronRight, ExternalLink, LoaderCircle, Pause, Play, RotateCcw, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button, Card } from "@/components/AppShell";

type Chapter = {
  id: number;
  name_simple: string;
  name_arabic: string;
  revelation_place: string;
  verses_count: number;
  translated_name: { name: string };
};

type Verse = {
  id: number;
  verse_number: number;
  verse_key: string;
  text_uthmani: string;
  page_number: number;
  juz_number: number;
  words: Array<{
    id: number;
    position: number;
    char_type_name: "word" | "end";
    text_uthmani: string;
  }>;
  translations: Array<{
    resource_id: number;
    text: string;
  }>;
  audio?: {
    url: string;
    segments?: Array<[number, number, number, number]>;
  };
};

export type QuranSessionMilestone = { surahNumber: number; surahName: string; fromAyah: number; toAyah: number; versesCount: number; minutes: number; completedAt: string; mode: "listened" | "read" };

export type QuranStudySelection = {
  id: string;
  surahNumber: number;
  surahName: string;
  startAyah: number;
  endAyah: number;
  lastCompletedAyah: number;
};

const QURAN_API = "https://api.quran.com/api/v4";

async function fetchChapters(): Promise<Chapter[]> {
  const response = await fetch(`${QURAN_API}/chapters?language=en`);
  if (!response.ok) throw new Error("Could not load the surah list.");
  const body = await response.json() as { chapters?: Chapter[] };
  return body.chapters ?? [];
}

async function fetchVerses(chapter: number): Promise<Verse[]> {
  const params = new URLSearchParams({
    fields: "text_uthmani",
    word_fields: "text_uthmani",
    words: "true",
    translations: "20",
    audio: "7",
    per_page: "300",
  });
  const response = await fetch(`${QURAN_API}/verses/by_chapter/${chapter}?${params}`);
  if (!response.ok) throw new Error("Could not load this surah.");
  const body = await response.json() as { verses?: Verse[] };
  return body.verses ?? [];
}

function audioUrl(path: string) {
  return path.startsWith("http") ? path : `https://verses.quran.com/${path}`;
}

function cleanTranslation(text: string) {
  return text
    .replace(/<sup[^>]*>.*?<\/sup>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function QuranReader({ studySelection, resumeRequest = 0, onVerseCompleted, onSessionComplete }: {
  studySelection?: QuranStudySelection | null;
  resumeRequest?: number;
  onVerseCompleted?: (goalId: string, ayah: number) => void;
  onSessionComplete?: (session: QuranSessionMilestone) => void;
}) {
  const [open, setOpen] = useState(true);
  const sessionRef = useRef<{ chapterId: number; surahName: string; verses: number[]; startedAt: number } | null>(null);
  function flushSession() {
    const session = sessionRef.current;
    sessionRef.current = null;
    if (!session || session.verses.length === 0) return;
    const sorted = [...new Set(session.verses)].sort((a, b) => a - b);
    onSessionComplete?.({ surahNumber: session.chapterId, surahName: session.surahName, fromAyah: sorted[0], toAyah: sorted[sorted.length - 1], versesCount: sorted.length, minutes: Math.max(1, Math.round((Date.now() - session.startedAt) / 60000)), completedAt: new Date().toISOString(), mode: "listened" });
  }
  const [chapterId, setChapterId] = useState(studySelection?.surahNumber ?? 1);
  const chapters = useQuery({ queryKey: ["quran-reader", "chapters"], queryFn: fetchChapters, staleTime: 1000 * 60 * 60 * 24 });
  const verses = useQuery({ queryKey: ["quran-reader", "verses", chapterId], queryFn: () => fetchVerses(chapterId), staleTime: 1000 * 60 * 60 * 24 });
  const chapter = chapters.data?.find(item => item.id === chapterId);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const [activeVerse, setActiveVerse] = useState<string | null>(null);
  const [playbackMs, setPlaybackMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playAll, setPlayAll] = useState(false);

  useEffect(() => {
    if (!studySelection) return;
    stopAudio();
    setChapterId(studySelection.surahNumber);
  }, [studySelection?.id, studySelection?.surahNumber]);

  useEffect(() => {
    if (!resumeRequest || !studySelection || chapterId !== studySelection.surahNumber || !verses.data?.length) return;
    const nextAyah = Math.max(studySelection.startAyah, studySelection.lastCompletedAyah + 1);
    const nextVerse = verses.data.find(item => item.verse_number === nextAyah && item.audio?.url);
    if (nextVerse) playVerse(nextVerse.verse_key, true);
  }, [resumeRequest, studySelection?.id, chapterId, verses.data]);

  useEffect(() => () => {
    audioRef.current?.pause();
    audioRef.current = null;
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
  }, []);

  useEffect(() => {
    if (!activeVerse || !playAll) return;
    document.getElementById(`quran-verse-${activeVerse.replace(":", "-")}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeVerse, playAll]);

  function stopProgressLoop() {
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    animationRef.current = null;
  }

  function startProgressLoop(player: HTMLAudioElement) {
    stopProgressLoop();
    const update = () => {
      setPlaybackMs(player.currentTime * 1000);
      if (!player.paused && !player.ended) animationRef.current = requestAnimationFrame(update);
    };
    animationRef.current = requestAnimationFrame(update);
  }

  function stopAudio() {
    flushSession();
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    stopProgressLoop();
    audioRef.current = null;
    setActiveVerse(null);
    setPlaybackMs(0);
    setIsPlaying(false);
    setPlayAll(false);
  }

  function playVerse(verseKey: string, continueThroughSurah = false) {
    const verseList = verses.data ?? [];
    const verseIndex = verseList.findIndex(item => item.verse_key === verseKey);
    const verse = verseList[verseIndex];
    if (!verse?.audio?.url) return;

    if (activeVerse === verseKey && audioRef.current) {
      if (audioRef.current.paused) {
        void audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
      return;
    }

    audioRef.current?.pause();
    stopProgressLoop();
    setPlaybackMs(0);
    const player = new Audio(audioUrl(verse.audio.url));
    audioRef.current = player;
    setActiveVerse(verseKey);
    setPlayAll(continueThroughSurah);
    player.onplay = () => { setIsPlaying(true); startProgressLoop(player); };
    player.onpause = () => { setIsPlaying(false); stopProgressLoop(); };
    player.onerror = () => stopAudio();
    player.onended = () => {
      if (!sessionRef.current || sessionRef.current.chapterId !== chapterId) sessionRef.current = { chapterId, surahName: chapter?.name_simple ?? `Surah ${chapterId}`, verses: [], startedAt: Date.now() - player.duration * 1000 };
      sessionRef.current.verses.push(verse.verse_number);
      if (studySelection?.surahNumber === chapterId && verse.verse_number >= studySelection.startAyah && verse.verse_number <= studySelection.endAyah) {
        onVerseCompleted?.(studySelection.id, verse.verse_number);
      }
      const next = verseList[verseIndex + 1];
      const reachedStudyEnd = studySelection?.surahNumber === chapterId && verse.verse_number >= studySelection.endAyah;
      if (continueThroughSurah && next && !reachedStudyEnd) {
        playVerse(next.verse_key, true);
      } else {
        stopAudio();
      }
    };
    void player.play().catch(() => stopAudio());
  }

  function moveChapter(direction: -1 | 1) {
    stopAudio();
    const next = Math.min(114, Math.max(1, chapterId + direction));
    setChapterId(next);
    document.getElementById("quran-reader")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <Card className="mb-8" >
      <section id="quran-reader" aria-labelledby="quran-reader-title" className="scroll-mt-28">
        <div className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
          <button type="button" aria-expanded={open} onClick={() => setOpen(value => !value)} className="flex w-full items-center justify-between gap-3 text-left md:w-auto">
            <div>
              <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-[color:var(--sage)]">
                <BookOpen className="size-4" /> Read the Quran
              </p>
              <h2 id="quran-reader-title" className="font-serif text-3xl">{chapter?.name_simple ?? "Choose a surah"}</h2>
              {chapter && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {chapter.translated_name.name} · {chapter.verses_count} ayat · {chapter.revelation_place === "makkah" ? "Makki" : "Madani"}
                </p>
              )}
            </div>
            <ChevronDown className={`size-5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
          <label className="grid gap-1.5 text-xs font-medium text-muted-foreground md:min-w-72">
            Surah
            <select
              value={chapterId}
              onChange={event => { stopAudio(); setChapterId(Number(event.target.value)); }}
              className="h-11 w-full rounded-lg bg-background px-3 text-sm text-foreground ring-1 ring-border"
              aria-label="Choose a surah"
            >
              {(chapters.data ?? []).map(item => (
                <option key={item.id} value={item.id}>{item.id}. {item.name_simple} — {item.translated_name.name}</option>
              ))}
            </select>
          </label>
        </div>
        {open && <>
        <div className="flex flex-wrap items-center gap-2 border-b border-border py-4">
          <Button
            variant="ghost"
            disabled={verses.isPending || !verses.data?.some(item => item.audio?.url)}
            onClick={() => {
              const first = verses.data?.find(item => item.audio?.url);
              if (first) playVerse(activeVerse && playAll ? activeVerse : first.verse_key, true);
            }}
            aria-label={isPlaying && playAll ? "Pause surah recitation" : "Listen to surah"}
          >
            {verses.isPending ? <LoaderCircle className="mr-2 inline size-4 animate-spin" /> : isPlaying && playAll ? <Pause className="mr-2 inline size-4" /> : <Play className="mr-2 inline size-4" />}
            {isPlaying && playAll ? "Pause recitation" : "Listen to surah"}
          </Button>
          {activeVerse && (
            <Button variant="ghost" onClick={stopAudio} aria-label="Stop recitation">
              <Square className="mr-2 inline size-4" /> Stop
            </Button>
          )}
          <span className="text-xs text-muted-foreground">Mishary Rashid Alafasy · verse by verse</span>
        </div>

        {studySelection?.surahNumber === chapterId && (
          <div className="flex flex-col gap-3 border-b border-border bg-muted/35 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Study goal · {studySelection.surahName} {studySelection.startAyah}–{studySelection.endAyah}</p>
              <p className="text-xs text-muted-foreground">Audio progress is saved after each ayah finishes.</p>
            </div>
            <Button
              variant="ghost"
              disabled={studySelection.lastCompletedAyah >= studySelection.endAyah || verses.isPending}
              onClick={() => {
                const nextAyah = Math.max(studySelection.startAyah, studySelection.lastCompletedAyah + 1);
                const nextVerse = verses.data?.find(item => item.verse_number === nextAyah);
                if (nextVerse) playVerse(nextVerse.verse_key, true);
              }}
            >
              <Play className="mr-2 inline size-4" /> Resume at ayah {Math.min(studySelection.endAyah, Math.max(studySelection.startAyah, studySelection.lastCompletedAyah + 1))}
            </Button>
          </div>
        )}

        {chapters.isError || verses.isError ? (
          <div className="py-14 text-center">
            <p className="text-sm text-muted-foreground">The Quran text could not be loaded right now.</p>
            <Button variant="ghost" className="mt-4" onClick={() => { chapters.refetch(); verses.refetch(); }}>
              <RotateCcw className="mr-2 inline size-4" /> Try again
            </Button>
          </div>
        ) : verses.isPending || chapters.isPending ? (
          <div className="space-y-5 py-8" aria-label="Loading Quran">
            {[1, 2, 3].map(item => <div key={item} className="h-24 animate-pulse rounded-lg bg-muted" />)}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {verses.data?.map(verse => (
              <article
                id={`quran-verse-${verse.verse_key.replace(":", "-")}`}
                key={verse.id}
                className={`scroll-mt-40 py-7 first:pt-8 ${activeVerse === verse.verse_key ? "bg-muted/45" : ""}`}
              >
                <div className="mb-4 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full ring-1 ring-border">{verse.verse_number}</span>
                    <Button
                      variant="ghost"
                      className="h-9 px-3"
                      disabled={verses.isPending || !verse.audio?.url}
                      onClick={() => playVerse(verse.verse_key)}
                      aria-label={`${activeVerse === verse.verse_key && isPlaying ? "Pause" : "Play"} verse ${verse.verse_key}`}
                    >
                      {activeVerse === verse.verse_key && isPlaying ? <Pause className="mr-1.5 inline size-4" /> : <Play className="mr-1.5 inline size-4" />}
                      {activeVerse === verse.verse_key && isPlaying ? "Pause" : "Listen"}
                    </Button>
                  </div>
                  <span>Juz {verse.juz_number} · Page {verse.page_number}</span>
                </div>
                <p lang="ar" dir="rtl" translate="no" className="font-quran text-right text-3xl leading-[2.25] md:text-4xl">
                  {verse.words?.length ? verse.words.map(word => {
                    const segment = verse.audio?.segments?.find(item => item[1] === word.position);
                    const isActiveWord = activeVerse === verse.verse_key && Boolean(segment) && playbackMs >= (segment?.[2] ?? 0) && playbackMs < (segment?.[3] ?? 0);
                    return (
                      <span
                        key={word.id}
                        className={isActiveWord ? "rounded-md bg-accent px-1 text-accent-foreground ring-1 ring-ring/30 transition-colors" : "px-1 transition-colors"}
                        aria-current={isActiveWord ? "true" : undefined}
                      >
                        {word.text_uthmani}
                      </span>
                    );
                  }) : verse.text_uthmani}
                </p>
                {verse.translations?.[0]?.text && (
                  <p lang="en" translate="no" className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
                    {cleanTranslation(verse.translations[0].text)}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between gap-2 sm:justify-start">
            <Button variant="ghost" aria-label="Previous surah" disabled={chapterId === 1} onClick={() => moveChapter(-1)}>
              <ChevronLeft className="mr-1 inline size-4" /> Previous
            </Button>
            <Button variant="ghost" aria-label="Next surah" disabled={chapterId === 114} onClick={() => moveChapter(1)}>
              Next <ChevronRight className="ml-1 inline size-4" />
            </Button>
          </div>
          <a
            href={`https://theclearquran.org/read/${chapterId}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Read The Clear Quran translation <ExternalLink className="ml-2 size-4" />
          </a>
          {onSessionComplete && chapter && (
            <button type="button" onClick={() => { stopAudio(); onSessionComplete({ surahNumber: chapter.id, surahName: chapter.name_simple, fromAyah: 1, toAyah: chapter.verses_count, versesCount: chapter.verses_count, minutes: 0, completedAt: new Date().toISOString(), mode: "read" }); }}
              className="inline-flex min-h-11 items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium ring-1 ring-border hover:bg-muted">
              Mark {chapter.name_simple} as read
            </button>
          )}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          Arabic text, word timings, and Saheeh International English translation provided by Quran.com. The Clear Quran® opens on its official reader and is credited to Dr. Mustafa Khattab.
        </p>
        </>}
      </section>
    </Card>
  );
}