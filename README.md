# QuietOps

A 60-second outage game that tests how alert layout affects diagnosis.

**Play it:** https://quiet-ops-kohl.vercel.app

**Live results:** https://quiet-ops-kohl.vercel.app/results

## The problem

During a production outage, engineers can face dozens of alerts at once. Many come from services affected by the same failure. Sorting through those symptoms takes time while the outage continues.

## How the game works

1. Read the outage briefing.
2. Investigate the alerts before the 60-second timer runs out.
3. Pick the suspected root cause from four choices.
4. See the outcome and the actual root cause on the result screen.

## The experiment

We hypothesize that grouping related alerts and showing service dependencies helps more players identify the root cause within 60 seconds.

| Dashboard | What players see |
| --- | --- |
| Control | A chronological alert list |
| Grouped | Related alerts grouped by likely root cause, with a service dependency view |

- **Primary metric:** Correct diagnoses (`incident_resolved_correctly`).
- **Secondary metrics:** Time to a correct diagnosis in seconds and incorrect diagnoses (`incident_resolved_incorrectly`).
- **Guardrail:** Timeouts (`incident_timed_out`).

Only each player's first round counts. Replaying the same incident makes it easier to find the answer.

## How we use Flagsmith

| Flag | Purpose |
| --- | --- |
| `dashboard_variant` | Multivariate experiment flag that assigns each player to the chronological or grouped dashboard. |
| `quietops_enabled` | Kill switch that shows a maintenance screen when turned off. |
| `game_config` | Remote configuration for timer length and intro text that can change without a deploy. |

Flagsmith locks the experiment flag while an experiment is running, so the kill switch and game settings use separate flags. The game stores a randomly generated anonymous ID in the browser so returning players keep their assignment without signing in.

## Results

The [live results page](https://quiet-ops-kohl.vercel.app/results) checks for updates about once a minute and shows each dashboard's success rate, the estimated chance the grouped view performs better, and how players answered. A Vercel function in `api/results.js` reads Flagsmith results with a key kept on the server.

_Experiment running. Final numbers will be posted here._

We stopped #595 early to redesign the grouped dashboard to resemble an on-call console and remove hints. We stopped #610 after one player to fix dependency lines that crossed service labels and make the map clickable. Only data from the current experiment, #795, counts. People who played an earlier version do not count again.

## Run it locally

Requires Node.js 20 or newer.

```sh
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:5173`. The game runs without a Flagsmith environment key. Those sessions do not contribute to the experiment.

## Tech stack

React, Vite, the Flagsmith JavaScript SDK, and Vercel.

## Team

- **Project lead (@TODO)** built the game flow, dashboards, Flagsmith experiment integration, and live results page.
- **Michael (@TODO)** worked on the result screen, project documentation, and player recruiting.

## Built for

Toggle Wars: The Flagsmith Experimentation Hackathon (WeMakeDevs), Track 01: Test Something Real.
