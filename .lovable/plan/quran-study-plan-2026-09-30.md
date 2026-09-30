# Quran Study Plan

## Goal
Add a private study-plan section to the Quran tab where each person can set dated surah goals, follow them in the reader, and see progress update as they listen or mark work complete.

## User experience
- Place “My study plan” above the Quran reader so today’s goal is immediately visible.
- Let users add a goal with a date, surah, optional start and end ayah, and a short intention or note.
- Show today’s goals first, followed by upcoming and completed goals.
- Display verse progress and a clear percentage bar for each goal.
- Provide actions to open the goal’s surah, resume from the next verse, mark it complete manually, or remove it.
- Keep the existing reader, English translation, live Arabic word highlighting, and session log unchanged.

## Audio synchronization
- When a planned surah is opened, connect its goal to the existing verse audio player.
- Mark each verse as reached when its recitation finishes, whether played individually or during full-surah playback.
- Resume playback from the first unfinished ayah in the selected goal’s range.
- Completing the final planned ayah completes the goal automatically; manual completion remains available for silent reading.

## Private progress storage
- Add a user-owned Quran study goals table containing date, surah identity/name, ayah range, last completed ayah, completion state, note, and timestamps.
- Apply authenticated-only access, row-level ownership rules, grants, validation, and updated-at handling.
- Add signed-in server actions to list, create, update progress, complete, and delete goals.

## Technical details
- Extend the Quran reader with controlled chapter selection, an optional resume ayah, and a verse-completed callback fired by real audio completion.
- Keep progress writes idempotent and monotonic so replaying an earlier verse never reduces progress.
- Use the existing Quran.com chapter and recitation data; no audio or Quran text will be stored by the app.
- Add accessible labels, mobile layouts, loading/error states, and success feedback.
- Update the Quran page metadata, roadmap, and architecture notes.

## Verification
- Confirm a goal can be created, opened, resumed, manually completed, and deleted.
- Confirm finishing audio for a verse advances the linked goal and persists after reload.
- Confirm full-surah playback advances through the chosen ayah range without changing unrelated goals.
- Check the Quran page on desktop and mobile, including long surahs and page scrolling.
- Run focused tests, type checking, and confirm the preview build is healthy.
