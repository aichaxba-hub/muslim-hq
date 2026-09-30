<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Dhikr speech recognition runs entirely through the browser Web Speech API so microphone audio and transcripts are never stored or sent to the app backend.
- Dhikr phrase recognition lives in a pure client-safe matcher module so phrase variants can be tested without microphone or UI dependencies.
- Quran Arabic text, Saheeh International English translation, and word timing data are read client-side from Quran.com's public API; The Clear Quran links to its official protected reader to respect licensing.
- Quran recitation audio streams client-side from Quran.com's verse audio API using Mishary Rashid Alafasy, with no audio stored by the app.
- Quran study goals are private user-owned records; progress advances only when a planned ayah's audio finishes or the user marks the goal complete.
- Answered duas are stored separately from the Dua Vault as private, user-owned gratitude journal entries.
- The personal Zakat calculator uses selectable majority/Hanafi gold or silver nisab, counts short-term holdings fully, estimates long-term and pay-now retirement holdings at 30%, deducts currently due obligations, and applies 2.5% only when net wealth meets nisab.
- Review's top dua category is the most common saved Dua Vault category created within the selected lifetime, year, or month.
