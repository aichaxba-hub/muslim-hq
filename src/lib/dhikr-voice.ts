export type DhikrMatch = {
  category: string;
  start: number;
  end: number;
};

type DhikrPhrase = {
  category: string;
  variants: RegExp[];
};

export const VOICE_DHIKR_CATEGORIES = [
  "SubhanAllah",
  "Alhamdulillah",
  "Allahu Akbar",
  "La ilaha illa Allah",
  "Astaghfirullah",
  "Salawat",
  "La hawla wa la quwwata illa billah",
  "HasbunAllahu wa ni'mal wakeel",
] as const;

const PHRASES: DhikrPhrase[] = [
  {
    category: "SubhanAllah",
    variants: [
      /(?:^|\s)سبحان\s+الله(?=\s|$)/gu,
      /(?:^|\s)subhan(?:a)?\s+(?:allah|allahumma)(?=\s|$)/gu,
    ],
  },
  {
    category: "Alhamdulillah",
    variants: [
      /(?:^|\s)الحمد\s+لله(?=\s|$)/gu,
      /(?:^|\s)(?:al\s+hamdu\s+lillah|alhamdulillah|hamdulillah)(?=\s|$)/gu,
    ],
  },
  {
    category: "Allahu Akbar",
    variants: [
      /(?:^|\s)الله\s+اكبر(?=\s|$)/gu,
      /(?:^|\s)allahu?\s+akbar(?=\s|$)/gu,
    ],
  },
  {
    category: "La ilaha illa Allah",
    variants: [
      /(?:^|\s)لا\s+اله\s+الا\s+الله(?=\s|$)/gu,
      /(?:^|\s)la\s+ilaha\s+(?:illa|ilallah|illa\s+allah)(?=\s|$)/gu,
    ],
  },
  {
    category: "Astaghfirullah",
    variants: [
      /(?:^|\s)استغفر\s+الله(?=\s|$)/gu,
      /(?:^|\s)(?:astaghfirullah|astagfirullah|astaghfir\s+allah|astagfir\s+allah)(?=\s|$)/gu,
    ],
  },
  {
    category: "Salawat",
    variants: [
      /(?:^|\s)اللهم\s+صل(?:ي)?\s+علي\s+محمد(?=\s|$)/gu,
      /(?:^|\s)allahumma\s+salli\s+(?:ala|alaa)\s+(?:muhammad|mohammed)(?=\s|$)/gu,
    ],
  },
  {
    category: "La hawla wa la quwwata illa billah",
    variants: [
      /(?:^|\s)لا\s+حول\s+ولا\s+قوه\s+الا\s+بالله(?=\s|$)/gu,
      /(?:^|\s)la\s+hawla\s+wa\s+la\s+quw+wata\s+illa\s+billah(?=\s|$)/gu,
    ],
  },
  {
    category: "HasbunAllahu wa ni'mal wakeel",
    variants: [
      /(?:^|\s)حسبنا\s+الله\s+ونعم\s+الوكيل(?=\s|$)/gu,
      /(?:^|\s)hasbun(?:a)?\s+allahu?\s+wa\s+ni(?:m|am)al\s+wakeel(?=\s|$)/gu,
    ],
  },
];

export function normalizeDhikrTranscript(value: string) {
  return value
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[’'`]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function findDhikrMatches(transcript: string): DhikrMatch[] {
  const normalized = normalizeDhikrTranscript(transcript);
  if (!normalized) return [];

  const matches: DhikrMatch[] = [];
  for (const phrase of PHRASES) {
    for (const variant of phrase.variants) {
      variant.lastIndex = 0;
      for (const match of normalized.matchAll(variant)) {
        const leadingSpace = match[0].startsWith(" ") ? 1 : 0;
        const start = (match.index ?? 0) + leadingSpace;
        matches.push({ category: phrase.category, start, end: (match.index ?? 0) + match[0].length });
      }
    }
  }

  return matches
    .sort((a, b) => a.start - b.start || b.end - a.end)
    .filter((match, index, all) => !all.slice(0, index).some(previous => match.start < previous.end && match.end > previous.start));
}