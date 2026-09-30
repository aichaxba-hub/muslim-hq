# Muslim HQ

Build a full-stack web app called Muslim HQ: The Ultimate Islamic System. This is a premium all-in-one Islamic life dashboard for Muslims to track worship, reflect, set goals, and stay consistent — beautiful, calm, and spiritually grounding in design.

VISUAL DIRECTION

Warm neutral palette: cream, beige, soft gold, sage green, charcoal. Two theme options: Light (cream + beige + muted gold) and Dark (charcoal + deep green + muted gold). Typography: clean, modern, elegant. Use Islamic geometric accents subtly. No clutter — spacious, breathable layout. The app should feel calming and premium.

MAIN PAGES / SECTIONS

1. Home Dashboard

Welcome banner with user's name and today's date (Gregorian + Hijri)

Daily intention text field

"Did I remember Allah today?" toggle

Live clock widget (embed)

Quick-link buttons: Prayer, Quran, Fasting, Dhikr, Duas, Goals, Reflection

Today's salah completion status (mini tracker)

Uplifting ayah or dua banner (rotating or static)

Habit streak highlights (Salah, Quran, Dhikr)

Quick-add buttons for log entries

2. Worship Hub — Daily Worship Log Track per day:

Fajr, Dhuhr, Asr, Maghrib, Isha — each with status: Completed On Time / Late / Qada / Excused

Excused Today toggle + Excuse Type (Menstruation, Postpartum, Illness, Travel, Other)

When excused: prayers not counted against streaks or percentages

Sunnah prayers completed (checkbox)

Nafl prayers completed (checkbox)

Congregation toggle (prayed alone or in congregation)

Jummah attended (checkbox, Fridays)

Fasted today toggle + fast type (Ramadan / Sunnah / Qada / Other)

Quran: pages read, juz, minutes, tafsir studied toggle

Dhikr count

Daily intention field

Notes field

Views: Today, This Week, This Month, Ramadan, Missed/Qada

3. Qada Salah Tracker (separate section)

Prayer name (Fajr, Dhuhr, Asr, Maghrib, Isha)

Original date missed

Date made up

Completed toggle

Status: Pending / Completed

Views: All Pending, Completed, By Prayer Type

4. Quran Tracker

Date, Surah, Juz, Pages, Minutes, Tafsir toggle, Reflection note

Progress summary: total pages, total juz, reading streak

5. Fasting Tracker

Date, Type, Completed toggle, Notes

Ramadan mode view

6. Dhikr Tracker

Date, Dhikr category, Count, Notes

Running totals

7. Dua Vault Categories: Forgiveness, Protection, Rizq/Wealth, Marriage & Family, Parents, Children, Anxiety & Sadness, Gratitude, Guidance, Illness & Healing, Travel, Death & Akhirah, Morning/Evening Adhkar, Before Sleep, Waking Up, Istikhara, Tawbah Each dua entry: Title, Arabic text, Transliteration, Translation, Source, Category, When to recite, Favorited toggle, Personal note Prefill with at least 10 sample duas across categories.

8. Reflection & Journaling Hub

Date, Week, Mood/Heart State (select: at peace, struggling, grateful, anxious, hopeful)

Reflection text (guided prompts): What brought me closest to Allah this week? Where did I fall short? What distracted my heart most? Which dua do I need to make more sincerely? One change to carry into next week?

Wins, Struggles, Gratitude, Next week intention

Views: Weekly, Monthly, Ramadan

9. Goals & Growth Hub Categories: Deen, Dunya, Habit, Memorization, Learning, Character/Tazkiyah, Jannah/Akhirah Fields: Goal, Category, Why it matters, Quarter, Target date, Status (Not Started / In Progress / Completed), Linked habits Habit streak tracker: Salah, Quran, Dhikr, Fasting — visual streak counter per habit.

10. Zakat & Giving Hub

Zakat calculator: asset type, amount, nisab check, zakat due

Zakat payments tracker: year, amount, paid toggle, date paid

Sadaqah log: date, amount, cause, notes

Ramadan giving tracker

Wealth duas section

11. Annual Review Dashboard Roll-up stats:

Prayer completion % and on-time %

Qada count

Fasting totals

Quran pages/juz read

Dhikr totals

Jummah attendance rate

Sadaqah total

Weekly reflections count

Best month / weakest month

Monthly trend charts

Top dua categories used

12. Reset & Realign Page Calming message: "You are not behind. You are being brought back." Guided prompts: What pulled me away? What can I simplify? What matters most right now? One small step today. Button: "Start fresh today" → links to Daily Log

13. Start Here — Beginner Guide What this system is, how to use it daily, where to start (step by step), what NOT to do (overwhelm warning), 3-day starter plan (Day 1: log salah only, Day 2: add Quran, Day 3: add reflection)

14. Tutorial Page How to log a day, how to track salah, how to use the dua vault, how to check progress, how to reset. Include placeholder sections for screenshots/videos.

SAMPLE DATA (prefill for all users)

5 days of filled Daily Worship Logs with varied statuses

5 sample duas in the vault

2 sample goals

2 sample reflections

1 sample zakat entry

1 sample qada entry

KEY FEATURES

Hijri date display alongside Gregorian date on dashboard

Habit streak logic: if all 5 prayers completed (and not excused), streak increments; if excused, streak is preserved not broken

Menstrual/excuse system: excused days excluded from all % calculations and streaks

Light and dark mode toggle

Mobile-friendly layout

User authentication so each user has their own private data

TONE & COPY Warm, non-judgmental, spiritually grounding. Built for consistency, not perfection. Use phrases like "your deen, your pace," "you are not behind," "one prayer at a time."

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/66bae040-08ca-4c10-98cd-3c58dbe2a670).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
