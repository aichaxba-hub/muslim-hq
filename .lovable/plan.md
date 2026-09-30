# Voice-counted dhikr

## What will be added
- Add a microphone mode beside the existing tap counter on the Dhikr page.
- Let the user choose Arabic or English recognition before listening.
- Recognize the existing common dhikr phrases, identify which one was spoken, and increment the counter once per detected recitation.
- Show the currently detected dhikr, listening state, and recent recognized words so the user can confirm accuracy.
- Keep microphone and tap counting independent of saved session history until the user chooses **Use count**, which copies the live count and detected category into the existing log form.
- Include clear states for microphone permission denial, unsupported browsers, stopping, and resetting.

## Recognition behavior
- Match normalized Arabic and common transliterated forms for SubhanAllah, Alhamdulillah, Allahu Akbar, La ilaha illa Allah, Astaghfirullah, and Salawat.
- Count repeated phrases within one spoken segment and avoid recounting finalized browser results.
- Do not send microphone audio or transcripts to the server; recognition stays in the browser.

## Verification
- Check the page in desktop and mobile layouts.
- Verify start/stop/reset, phrase matching, category detection, and copying the count into the log form.
- Confirm the app builds without errors.
