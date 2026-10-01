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

- Dhikr speech recognition uses browser Web Speech API only; audio and transcripts never reach the backend. Phrase matching stays client-safe for independent tests.
- Quran Arabic, Saheeh English and word timing come from Quran.com's public API; Mishary Rashid Alafasy audio streams from its verse API. The Clear Quran links to its official reader for licensing; no audio is stored.
- Quran study goals are private user-owned records; progress advances only when a planned ayah's audio finishes or the user marks the goal complete.
- Answered duas are stored separately from the Dua Vault as private, user-owned gratitude journal entries.
- The personal Zakat calculator uses majority gold or silver nisab, counts short-term holdings fully, estimates long-term and pay-now retirement holdings at 30%, deducts currently due obligations, and applies 2.5% only when net wealth meets nisab.
- Hawl reminders are derived from the saved anniversary at view time, not scheduled, because no external delivery or persisted status is needed.
- Review's top dua category is the most common saved Dua Vault category created within the selected lifetime, year, or month.
- Salah → Qada sync is server-side; menstruation/postpartum excusals remove dated obligations, preventing false missed counts.
- Activity-aware reminders run client-side in ReminderCenter (settings in localStorage) because no push delivery service is configured.
- Offline support uses vite-plugin-pwa generateSW into dist/client; signed-in screens need the network, so navigations fall back to /offline.
- Profile exports generate JSON, CSV, or Excel after a private fetch.
- Qada completion optimistically updates the shared cache, then reconciles after save.
- Worship snapshots stay private per account; restore adds missing records only and reset clears backups.
