export interface SeedDua {
  title: string;
  arabic: string;
  transliteration: string;
  translation: string;
  source: string;
  category: string;
  when_to_recite: string;
}

export const SEED_DUAS: SeedDua[] = [
  {
    title: "Sayyidul Istighfar",
    arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ",
    transliteration: "Allahumma anta rabbi, la ilaha illa anta, khalaqtani wa ana 'abduk...",
    translation: "O Allah, You are my Lord. None has the right to be worshipped but You. You created me and I am Your servant...",
    source: "Sahih al-Bukhari 6306",
    category: "Forgiveness",
    when_to_recite: "Morning and evening",
  },
  {
    title: "Dua for Protection Morning & Evening",
    arabic: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
    transliteration: "Bismillahil-ladhi la yadurru ma'as-mihi shay'un fil-ardi wa la fis-sama'i wa huwas-Sami'ul-'Alim",
    translation: "In the name of Allah, with whose name nothing on earth or in the sky can cause harm; He is the All-Hearing, the All-Knowing.",
    source: "Abu Dawud 5088, Tirmidhi 3388",
    category: "Protection",
    when_to_recite: "3x morning and evening",
  },
  {
    title: "Dua for Increase in Rizq",
    arabic: "اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ",
    transliteration: "Allahumma-kfini bi halalika 'an haramika wa aghnini bi fadlika 'amman siwak",
    translation: "O Allah, suffice me with what You have made lawful, keeping me from what You have made unlawful, and enrich me from Your bounty, from having need of others.",
    source: "Tirmidhi 3563",
    category: "Rizq/Wealth",
    when_to_recite: "After Fajr or whenever seeking sustenance",
  },
  {
    title: "Dua for a Righteous Spouse & Family",
    arabic: "رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا",
    transliteration: "Rabbana hab lana min azwajina wa dhurriyyatina qurrata a'yun waj'alna lil-muttaqina imama",
    translation: "Our Lord, grant us from among our spouses and offspring comfort to our eyes, and make us a leader for the righteous.",
    source: "Qur'an 25:74",
    category: "Marriage & Family",
    when_to_recite: "After prayer, in tahajjud",
  },
  {
    title: "Dua for Parents",
    arabic: "رَبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا",
    transliteration: "Rabbir-hamhuma kama rabbayani saghira",
    translation: "My Lord, have mercy upon them as they brought me up when I was small.",
    source: "Qur'an 17:24",
    category: "Parents",
    when_to_recite: "Daily",
  },
  {
    title: "Dua for Anxiety and Sadness",
    arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ",
    transliteration: "Allahumma inni a'udhu bika minal-hammi wal-hazan",
    translation: "O Allah, I seek refuge in You from anxiety and sorrow.",
    source: "Sahih al-Bukhari 2893",
    category: "Anxiety & Sadness",
    when_to_recite: "When feeling burdened",
  },
  {
    title: "Dua of Gratitude",
    arabic: "اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ",
    transliteration: "Allahumma a'inni 'ala dhikrika wa shukrika wa husni 'ibadatik",
    translation: "O Allah, help me remember You, thank You, and worship You in the best manner.",
    source: "Abu Dawud 1522",
    category: "Gratitude",
    when_to_recite: "After every prayer",
  },
  {
    title: "Dua for Guidance",
    arabic: "اللَّهُمَّ اهْدِنِي وَسَدِّدْنِي",
    transliteration: "Allahummah-dini wa saddidni",
    translation: "O Allah, guide me and make me steadfast.",
    source: "Sahih Muslim 2725",
    category: "Guidance",
    when_to_recite: "Anytime you need direction",
  },
  {
    title: "Dua for Healing",
    arabic: "اللَّهُمَّ رَبَّ النَّاسِ أَذْهِبِ الْبَاسَ اشْفِ أَنْتَ الشَّافِي",
    transliteration: "Allahumma rabban-nas adhhibil-ba's, ishfi antash-Shafi...",
    translation: "O Allah, Lord of mankind, remove the harm and heal, for You are the Healer...",
    source: "Sahih al-Bukhari 5675",
    category: "Illness & Healing",
    when_to_recite: "When ill or visiting the sick",
  },
  {
    title: "Dua Before Sleep",
    arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
    transliteration: "Bismika Allahumma amutu wa ahya",
    translation: "In Your name, O Allah, I die and I live.",
    source: "Sahih al-Bukhari 6314",
    category: "Before Sleep",
    when_to_recite: "Just before sleeping",
  },
  {
    title: "Dua Upon Waking",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ",
    transliteration: "Alhamdu lillahil-ladhi ahyana ba'da ma amatana wa ilayhin-nushur",
    translation: "All praise is for Allah who gave us life after taking it, and to Him is the resurrection.",
    source: "Sahih al-Bukhari 6312",
    category: "Waking Up",
    when_to_recite: "First thing upon waking",
  },
  {
    title: "Istikhara",
    arabic: "اللَّهُمَّ إِنِّي أَسْتَخِيرُكَ بِعِلْمِكَ وَأَسْتَقْدِرُكَ بِقُدْرَتِكَ",
    transliteration: "Allahumma inni astakhiruka bi 'ilmika wa astaqdiruka bi qudratik...",
    translation: "O Allah, I seek Your guidance through Your knowledge, and I seek ability through Your power...",
    source: "Sahih al-Bukhari 6382",
    category: "Istikhara",
    when_to_recite: "Before major decisions",
  },
  {
    title: "Dua of Tawbah",
    arabic: "رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ",
    transliteration: "Rabbigh-fir li wa tub 'alayya innaka antat-Tawwabur-Rahim",
    translation: "My Lord, forgive me and accept my repentance. You are the Ever-Accepting of Repentance, the Most Merciful.",
    source: "Abu Dawud 1516",
    category: "Tawbah",
    when_to_recite: "Anytime",
  },
];

export const DUA_CATEGORIES = [
  "Forgiveness", "Protection", "Rizq/Wealth", "Marriage & Family",
  "Parents", "Children", "Anxiety & Sadness", "Gratitude",
  "Guidance", "Illness & Healing", "Travel", "Death & Akhirah",
  "Morning/Evening Adhkar", "Before Sleep", "Waking Up", "Istikhara", "Tawbah",
];

export const AYAT_BANNERS = [
  { text: "And He is with you wherever you are.", ref: "Surah Al-Hadid 57:4" },
  { text: "So remember Me; I will remember you.", ref: "Surah Al-Baqarah 2:152" },
  { text: "Verily, with hardship comes ease.", ref: "Surah Ash-Sharh 94:6" },
  { text: "And whoever relies upon Allah — then He is sufficient for him.", ref: "Surah At-Talaq 65:3" },
  { text: "Call upon Me; I will respond to you.", ref: "Surah Ghafir 40:60" },
];
