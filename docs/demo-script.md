# QuietOps demo video (~2.5 min)

Record **Sat Nov 28 after 2 PM PT** (decision time), so the ending is the real verdict.
Order follows CLAUDE.md §10: problem → play → the flag → kill switch / config → results → rollout.

## Before recording (prep checklist)
- [ ] Practise the staged rollout on the **Development** simulated experiment (#805) first, so nothing on
      Production is a surprise: complete it, then set the grouped % on `dashboard_variant` to 10 → 50 → 100.
- [ ] Local dev server running (`npm run dev`) for the dev-only `?variant=control` / `?variant=grouped`
      views. **Open https://quiet-ops-kohl.vercel.app/?team=1 once in the recording browser** so playing the
      live site isn't a counted round (or play it on localhost, which talks to Development).
- [ ] Tabs open: live game, live `/results`, Flagsmith → Production → `dashboard_variant`, `quietops_enabled`,
      experiment #795, and `src/App.jsx` + `src/lib/flagsmith.js` in the editor.
- [ ] Screen at 1440×900, browser zoom 110%, notifications off.

## Shot list

| Time | Show | Say (roughly) |
|---|---|---|
| 0:00–0:15 | List view (`?variant=control`), scroll through the 26 alerts | "During an outage, on-call engineers get flooded: dozens of alerts at once, most of them side effects. Finding the one real cause is slow, and every minute is lost revenue." |
| 0:15–0:45 | Intro pager → **Acknowledge** → list view → **Diagnose** → pick an answer → result screen | "QuietOps recreates that in 60 seconds. You're paged at 2 AM, alerts are firing, find the root cause." |
| 0:45–1:10 | Grouped view (`?variant=grouped`): click a service on the map, its alerts open. Then Flagsmith: `dashboard_variant`, 50/50 in experiment #795. Then code: the one `variant === 'grouped'` line, `getExperimentFlag`, `trackEvent` | "Half the players get this instead: the same alerts grouped into one incident with a blast-radius map. Flagsmith decides who sees which, records the exposure, and the game sends one event: found it, wrong call, or out of time." |
| 1:10–1:30 | Flagsmith: switch `quietops_enabled` **off on Production** → live site shows maintenance → switch it back on (keep it under 30 s). Then `game_config` timer change in **Development**, reload localhost | "The experiment flag is locked while the test runs, so control lives in separate flags: a kill switch, and remote config for the timer. We change config only in Development: changing it on Production would change the test mid-run." |
| 1:30–2:05 | `/results`: open "The decision rule", then the verdict, the chance grouped is better, the outcome chart. Then the Flagsmith experiment page with the same numbers | "We wrote the decision rule down before any results came in: 80% chance or better, no extra wrong calls, at least 30 players per version. Here's what N real players showed…" (read the verdict). |
| 2:05–2:30 | Apply the verdict. **Grouped wins:** complete #795, set grouped to 10% → 50% → 100% on `dashboard_variant`, show the `/results` rollout tracker filling. **List wins or inconclusive:** complete #795 keeping the list, say so | Grouped: "The data picked the winner, and the same flag ships it, in stages." Otherwise: "The data said keep the list, so we did. That's the point of testing instead of guessing." |

## Lines to have ready
- Simulated traffic: "We built a simulator, but it only ever writes to the Development environment
  (experiment #805, assumed rates). Every number on /results is from real players."
- Fairness: "The grouped view never names or ranks a cause. Its rows are ordered by alert count, not time,
  because the earliest alert would give the answer away."
- One try: "Only a player's first round counts. Replays record no exposure."

## After recording
- Fill the final numbers into the README (Michael) and `/results` will already show them.
- Upload, add the link to the submission, submit before **Sat night PT**.
