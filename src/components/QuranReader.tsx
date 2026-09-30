import { useQuery } from "@tanstack/react-query";
import { BookOpen, ChevronLeft, ChevronRight, ExternalLink, LoaderCircle, Pause, Play, RotateCcw, Square } from "lucide-react";
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
};

type AudioFile = {
  verse_key: string;
  url: string;
};

const QURAN_API = "https://api.quran.com/api/v4";

async function fetchChapters(): Promise<Chapter[]> {
  const response = await fetch(`${QURAN_API}/chapters?language=en`);
  if (!response.ok) throw new Error("Could not load the surah list.");
  const body = await response.json() as { chapters?: Chapter[] };
  return body.chapters ?? [];
}

async function fetchVerses(chapter: number): Promise<Verse[]> {
  const response = await fetch(`${QURAN_API}/verses/by_chapter/${chapter}?fields=text_uthmani&per_page=300`);
  if (!response.ok) throw new Error("Could not load this surah.");
  const body = await response.json() as { verses?: Verse[] };
  return body.verses ?? [];
}

async function fetchAudio(chapter: number): Promise<AudioFile[]> {
  const response = await fetch(`${QURAN_API}/quran/recitations/7?chapter_number=${chapter}`);
  if (!response.ok) throw new Error("Could not load recitation audio.");
  const body = await response.json() as { audio_files?: AudioFile[] };
  return body.audio_files ?? [];
}

function audioUrl(path: string) {
  return path.startsWith("http") ? path : `https://verses.quran.com/${path}`;
}

export function QuranReader() {
  const [chapterId, setChapterId] = useState(1);
  const chapters = useQuery({ queryKey: ["quran-reader", "chapters"], queryFn: fetchChapters, staleTime: 1000 * 60 * 60 * 24 });
  const verses = useQuery({ queryKey: ["quran-reader", "verses", chapterId], queryFn: () => fetchVerses(chapterId), staleTime: 1000 * 60 * 60 * 24 });
  const recitation = useQuery({ queryKey: ["quran-reader", "recitation", chapterId], queryFn: () => fetchAudio(chapterId), staleTime: 1000 * 60 * 60 * 24 });
  const chapter = chapters.data?.find(item => item.id === chapterId);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [activeVerse, setActiveVerse] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playAll, setPlayAll] = useState(false);

  useEffect(() => () => {
    audioRef.current?.pause();
    audioRef.current = null;
  }, []);

  function stopAudio() {
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    audioRef.current = null;
    setActiveVerse(null);
    setIsPlaying(false);
    setPlayAll(false);
  }

  function playVerse(verseKey: string, continueThroughSurah = false) {
    const files = recitation.data ?? [];
    const fileIndex = files.findIndex(item => item.verse_key === verseKey);
    const file = files[fileIndex];
    if (!file) return;

    if (activeVerse === verseKey && audioRef.current) {
      if (audioRef.current.paused) {
        void audioRef.current.play();
        setIsPlaying(true);
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      return;
    }

    audioRef.current?.pause();
    const player = new Audio(audioUrl(file.url));
    audioRef.current = player;
    setActiveVerse(verseKey);
    setPlayAll(continueThroughSurah);
    player.onplay = () => setIsPlaying(true);
    player.onpause = () => setIsPlaying(false);
    player.onerror = () => stopAudio();
    player.onended = () => {
      const next = files[fileIndex + 1];
      if (continueThroughSurah && next) {
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

        <div className="flex flex-wrap items-center gap-2 border-b border-border py-4">
          <Button
            variant="ghost"
            disabled={recitation.isPending || !recitation.data?.length}
            onClick={() => {
              const first = recitation.data?.[0];
              if (first) playVerse(activeVerse && playAll ? activeVerse : first.verse_key, true);
            }}
            aria-label={isPlaying && playAll ? "Pause surah recitation" : "Listen to surah"}
          >
            {recitation.isPending ? <LoaderCircle className="mr-2 inline size-4 animate-spin" /> : isPlaying && playAll ? <Pause className="mr-2 inline size-4" /> : <Play className="mr-2 inline size-4" />}
            {isPlaying && playAll ? "Pause recitation" : "Listen to surah"}
          </Button>
          {activeVerse && (
            <Button variant="ghost" onClick={stopAudio} aria-label="Stop recitation">
              <Square className="mr-2 inline size-4" /> Stop
            </Button>
          )}
          <span className="text-xs text-muted-foreground">Mishary Rashid Alafasy · verse by verse</span>
        </div>

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
              <article key={verse.id} className="py-7 first:pt-8">
                <div className="mb-4 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full ring-1 ring-border">{verse.verse_number}</span>
                    <Button
                      variant="ghost"
                      className="h-9 px-3"
                      disabled={recitation.isPending || !recitation.data?.some(item => item.verse_key === verse.verse_key)}
                      onClick={() => playVerse(verse.verse_key)}
                      aria-label={`${activeVerse === verse.verse_key && isPlaying ? "Pause" : "Play"} verse ${verse.verse_key}`}
                    >
                      {activeVerse === verse.verse_key && isPlaying ? <Pause className="mr-1.5 inline size-4" /> : <Play className="mr-1.5 inline size-4" />}
                      {activeVerse === verse.verse_key && isPlaying ? "Pause" : "Listen"}
                    </Button>
                  </div>
                  <span>Juz {verse.juz_number} · Page {verse.page_number}</span>
                </div>
                <p lang="ar" dir="rtl" translate="no" className="text-right text-3xl leading-[2.25] md:text-4xl">
                  {verse.text_uthmani}
                </p>
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
        </div>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          Arabic text provided by Quran.com. The Clear Quran® translation opens on its official reader and is credited to Dr. Mustafa Khattab.
        </p>
      </section>
    </Card>
  );
}