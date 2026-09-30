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
- Quran Arabic text is read client-side from Quran.com's public API; The Clear Quran translation links to its official protected reader to respect licensing.
- Quran recitation audio streams client-side from Quran.com's verse audio API using Mishary Rashid Alafasy, with no audio stored by the app.
- Answered duas are stored separately from the Dua Vault as private, user-owned gratitude journal entries.
