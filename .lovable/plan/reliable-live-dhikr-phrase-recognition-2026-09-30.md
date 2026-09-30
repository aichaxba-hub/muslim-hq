# Reliable live dhikr phrase recognition

## Goal
Make the voice counter increment only when it hears a supported dhikr phrase, including common Arabic and transliterated pronunciation variants, while continuing to count during recitation.

## Changes
- Replace broad regular-expression matching with a phrase catalogue for common adhkar and safe pronunciation variants.
- Normalize Arabic diacritics, letter variants, punctuation, and common transliteration spellings before comparison.
- Count complete phrase occurrences in each evolving speech result and deduplicate interim/final updates so every recitation increments once.
- Ignore unrelated speech and show a clear “not recognized” state without changing the count.
- Keep microphone audio and transcripts entirely in the browser; no voice data will be saved or sent to the app backend.
- Add focused matcher tests covering accepted phrases, repeated recitations, partial phrases, and unrelated words.

## Supported phrases
SubhanAllah, Alhamdulillah, Allahu Akbar, La ilaha illa Allah, Astaghfirullah, Salawat, La hawla wa la quwwata illa billah, and HasbunAllahu wa ni'mal wakeel.
