# Quran translation and live recitation highlighting

## What will change

- Show an English translation beneath every Arabic ayah inside the Quran reader.
- Use the Quran.com English translation available for in-app display, while retaining the existing official Clear Quran link because that translation is protected.
- Render each Arabic ayah as individual word spans so the currently recited word can be highlighted in real time.
- Synchronize the highlight to Mishary Rashid Alafasy’s verse audio using Quran.com’s word-level timing segments.
- Keep verse playback, full-surah playback, pause, resume, stop, chapter switching, and scrolling behavior working as they do now.

## Reading and playback behavior

- The active word receives a clear gold/sage emphasis that remains legible in light and dark themes.
- During continuous playback, the active ayah is also subtly marked and scrolled into view only when needed.
- Pausing freezes the current highlight; stopping or changing surah clears it.
- If timing data is unavailable for an ayah, playback still works and the ayah receives a verse-level active state instead of failing.
- Loading and error states cover Arabic text, translation, and recitation data together.

## Technical details

- Request verses with `words=true`, English translation resource `20` (Saheeh International), reciter `7`, and word/audio timing fields from Quran.com’s public API.
- Extend the verse model with word data, translation text, audio URL, and timing segments.
- Drive the current word from the audio element’s playback time and the selected verse’s timing ranges.
- Strip API footnote markup from the displayed English text rather than injecting HTML.
- Update the Quran page description and the project’s Quran integration note to accurately name the embedded translation and synchronization behavior.

## Verification

- Confirm Al-Fatihah renders Arabic and English for every ayah.
- Play a single ayah and confirm the Arabic highlight advances word by word, pauses, resumes, and clears on stop.
- Play the full surah and confirm highlighting moves into the next ayah.
- Confirm a long surah renders and the page remains scrollable on desktop and mobile widths.
- Check the app build and Quran reader runtime for errors.
