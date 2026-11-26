# Task 2: README.md

**Branch:** `feature/readme`
**Files you may create/edit:** `README.md` (repo root). **Nothing else.**

## What it is
The front page of the GitHub repo. Hackathon judges will read it, so it has to explain clearly what QuietOps is,
why it matters, and how Flagsmith is used. **Accuracy matters more than length.** Don't invent features,
numbers or results.

## Where to get the facts
Read these files first and only describe what they actually say or do:
- `AGENTS.md`: what the project is
- `CLAUDE.md`: the full plan: problem, hypothesis, variants, metrics, flags (sections 3 and 4)
- `src/lib/flagsmith.js`: the exact flag names and event names used in code
- `package.json`: the scripts and dependencies

If something in the plan isn't built yet (check the code), either leave it out or mark it "(coming soon)".

## Sections to include (in this order)
1. **QuietOps**: one-line tagline, e.g. "A 60-second outage game that A/B tests how alerts should be shown."
   Under it, a placeholder line: `**Play it:** _link coming soon_` (the lead will add the live URL).
2. **The problem**: alert fatigue: during outages engineers get flooded with dozens of alerts, most are
   side effects, and finding the real root cause is slow. 3–4 sentences max.
3. **How the game works**: the 4 steps: intro → alert dashboard (60s timer) → pick the root cause from 4 choices → result screen.
4. **The experiment**:
   - Hypothesis (copy the meaning from CLAUDE.md §3)
   - A small table: Control (chronological list) vs Grouped (alerts grouped by root cause + dependency view)
   - Metrics: primary `incident_resolved_correctly`; secondary diagnosis time and `incident_resolved_incorrectly`; guardrail `incident_timed_out`
   - Note that only a player's **first** round is counted, because replaying the same incident is easier.
5. **How we use Flagsmith**: a table of the 3 flags and what each does:
   - `dashboard_variant`: multivariate experiment flag that picks list vs grouped per player
   - `quietops_enabled`: kill switch (shows a maintenance screen when off)
   - `game_config`: remote config (timer length, intro text) changeable without a deploy

   Plus one sentence on why the kill switch and config are separate flags: the experiment flag is locked while an experiment runs.
   Also mention: anonymous player IDs (no login), so each player always sees the same version.
6. **Results**: write `_Experiment running. Results will be posted here._` We'll fill this in with real numbers later.
7. **Run it locally**: the commands from AGENTS.md (`npm install`, copy `.env.example` to `.env.local`, `npm run dev`).
   Say the app works without a key but won't be part of the experiment.
8. **Tech stack**: React + Vite, Flagsmith JS SDK, Vercel.
9. **Team**: the lead and Michael, with what each built. Leave GitHub handles as `@TODO` for the lead to fill in.
10. **Built for**: Toggle Wars: The Flagsmith Experimentation Hackathon (WeMakeDevs), Track 01: Test Something Real.

## Style
- Plain, confident English. Short paragraphs, headings, tables where helpful.
- **No** emoji walls, no marketing fluff ("revolutionary", "cutting-edge", etc.).
- **Never** include keys, the contents of `.env.local`, or the Flagsmith environment key.

## How to check it
- Open the README preview in VS Code (Ctrl+Shift+V) and read it top to bottom. Does a stranger understand the game in 30 seconds?
- Every flag/event name exactly matches `src/lib/flagsmith.js` (they're case-sensitive).

## When done
Commit, push `feature/readme`, open a Pull Request to `main`.
