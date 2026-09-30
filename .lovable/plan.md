# Comprehensive Zakat Calculator

## Goal
Replace the single-amount calculator in the Zakat tab with a guided seven-step calculator modeled on the shared reference, while preserving Muslim HQ’s visual style and existing saved Zakat entries.

## Calculator flow
1. Currency, hawl date, and gold- or silver-based nisab selection.
2. Gold and silver holdings by grams, with editable per-gram prices.
3. Cash in hand, checking, savings, and other cash accounts.
4. Brokerage assets using a straightforward total zakatable-value entry.
5. Retirement accounts, including defer/pay-now controls and the reference’s 30% pay-now treatment; Roth contributions remain directly editable.
6. Cryptocurrency, investment art/collectibles, business assets, money owed to the user, and other assets.
7. Currently due debts and expenses.

## Results and behavior
- Keep a live summary visible throughout, showing category totals, deductions, net zakatable wealth, nisab threshold, and estimated Zakat at 2.5%.
- Show whether the user is above or below nisab and never calculate Zakat on a negative balance.
- Save unfinished calculator values in the browser automatically, with a reset action.
- Let users save the final total into the existing private Zakat entries list.
- Clearly note that this is an estimate and local scholarly guidance may differ.

## Verification
- Check forward/back navigation, live calculations, nisab behavior, retirement defer/pay-now behavior, automatic draft restoration, reset, final save, mobile layout, page metadata, and build health.
