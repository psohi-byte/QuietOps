# QuietOps — Project Brief (Starting Point)

> **This is a starting plan, not a fixed spec.** Feel free to change the stack, structure, scope or details if you find a better approach. Just explain the change and why before making it. The goals (winning Track 01, keeping the experiment clean, shipping on time) matter more than following this doc exactly.

---

## 1. The Event
- **Hackathon:** Toggle Wars: The Flagsmith Experimentation Hackathon (WeMakeDevs, sponsored by Flagsmith). Online, free.
- **Event page:** https://www.wemakedevs.org/hackathons/flagsmith
- **Start:** Wed Nov 25, 2026, 6:30 PM PT (8 AM IST Nov 26)
- **Deadline:** Sun Nov 29, 2026, 6:30 AM PT (8 PM IST Nov 29) → **treat Saturday night PT as the real deadline**
- **Theme:** Build a project with feature flags, then use Flagsmith Experimentation to A/B test versions and let the data pick the winner.
- **AI tools allowed**, but the team must be able to explain everything that was built. Explain code clearly as you write it.
- Check the event's "Rules" tab for the submission checklist.

## 2. Track & Judging
**Track 01: Test Something Real ($2,000).** One winner. The experiment matters more than app size. Simulated traffic is allowed.

**Scored on (all tracks):**
1. **Use of Flagsmith:** central to the project, flags/experiments do real work
2. **Impact:** solves a real problem developers or teams face
3. **Creativity:** new idea, or a familiar one applied in a new way
4. **Demo video:** clearly shows the problem, the build, and Flagsmith's role

**Track 01 extras:** a well-executed experiment (over many features), a clear hypothesis, versions behind a flag, a metric from real events, and explainable results.

## 3. The Idea: QuietOps
**Problem:** During production outages, engineers get flooded with dozens of alerts at once (alert fatigue). Most are side effects, and finding the real root cause is slow and costly.

**Product:** A 60-second interactive incident-response game.
1. **Intro:** "Production is down. Find the root cause. You have 60 seconds."
2. **Dashboard:** ~25 fake alerts firing (shown as Variant A or B)
3. **Answer:** "What's the root cause?" Pick one of 4 choices
4. **Result screen:** correct/wrong + time, share button, play again

**Hypothesis:** Grouping related alerts by root cause (with a simple dependency view) increases the percentage of players who correctly identify the root cause within 60 seconds, compared to a traditional chronological alert list.

**Variants (multivariate flag `dashboard_variant`):**
| | Control (A) | Variant `grouped` (B) |
|---|---|---|
| Layout | Chronological notifications | Related alerts consolidated into groups |
| Context | None | Simple dependency view (boxes + arrows is enough) |
| Investigation | Manual | Guided by grouping |

**Metrics:**
- **Primary:** `incident_resolved_correctly` (fires when the player picks the correct root cause)
- **Secondary:** diagnosis time (seconds), incorrect diagnoses (`incident_resolved_incorrectly`)
- **Optional guardrail:** timed out / gave up

**Pitch to judges:** "Engineers drown in alerts during outages. We built a game that recreates one and used Flagsmith Experimentation to test whether grouped alerts help people find the real problem faster. Here's what the data showed, and here's us rolling out the winner with the same flag."

**Edge:** It's a game, so we can recruit **real players** (Flagsmith/WeMakeDevs Discords, friends) for real data, with simulated traffic as backup.

## 4. Flagsmith Setup (important gotchas)
Use Flagsmith's official coding-agent setup prompt:
https://docs.flagsmith.com/experimentation/set-up-with-a-coding-agent

- **Use the Flagsmith CLI (v2+), not the MCP server.** The MCP server can't start experiments.
- **Flagsmith Cloud (free tier)** with a **connected warehouse** is required. Check this first, and stop if it's missing.
- **SDK:** `@flagsmith/flagsmith` **12.4.0+** (needed to send events).
- **User identity:** no logins, so generate a random anonymous player ID, store it in `localStorage` (wrap in try/catch), and identify the user **before** requesting the flag. Use the same ID for exposures and conversions.
- **Every variation needs a key**, or no exposures are recorded.
- **Event names must match exactly** (case-sensitive) between code and metric.
- **Flush buffered events** before the page/process exits.
- **The experiment flag is locked while the experiment runs.** So the kill switch and remote config must be **separate flags**:
  - `quietops_enabled`: kill switch (shows a "maintenance" screen if off)
  - `game_config`: remote config (e.g. timer length, intro text)
- Start the experiment only after the code changes are in place and verified.
- End of event: **roll out the winner** through the flag (ideally staged 10% → 50% → 100%) and show it in the demo.

## 5. Stack & Structure (suggested, change if better)
- React + Vite, deployed on Vercel (auto-deploy from `main`)
- Flagsmith JS SDK

```
/data/incident.json                 # scenario + alerts (shared contract)
/src/components/dashboard/ListView  # Variant A (owner: lead)
/src/components/dashboard/GroupedView # Variant B (owner: lead)
/src/components/game/Intro          # (owner: lead)
/src/components/game/Timer          # (owner: lead)
/src/components/game/AnswerScreen   # (owner: lead)
/src/components/game/ResultScreen.jsx  # OWNER: MICHAEL. Do not edit.
/src/lib/flagsmith.js               # SDK init, identify, events
/scripts/simulate.js                # backup traffic simulator
README.md                           # OWNER: MICHAEL. Do not edit.
```

**Data contract (`/data/incident.json`):**
```json
{
  "scenario": "Checkout is down",
  "rootCause": "db-primary",
  "services": [
    { "id": "db-primary", "dependsOn": [] },
    { "id": "api", "dependsOn": ["db-primary"] }
  ],
  "alerts": [
    { "id": 1, "time": "02:14:03", "service": "api", "severity": "critical",
      "message": "5xx rate > 40%", "group": "db-primary" }
  ],
  "choices": ["db-primary", "api", "cdn", "payments"]
}
```
Generate one realistic outage scenario with ~25 alerts. The root cause should be findable but buried among symptom alerts in the list view.

**ResultScreen props (contract with Michael):** `correct` (bool), `seconds` (number), `rootCause` (string), optional `timedOut` (bool), and an `onPlayAgain` callback. Full spec: `tasks/michael/01-result-screen.md`.

**Game flow:**
```
Intro → Timer starts → Dashboard (A or B via Flagsmith) → AnswerScreen → events fire → ResultScreen
```

## 6. Team
**Lead (me, Claude Code):** all core code: skeleton, deploy, Flagsmith SDK + flags + experiment, both dashboards, intro/timer/answer screens, event tracking, simulator, scenario data, demo video.

**Michael (beginner, uses Codex for prompting):** light tasks:
- Sign up (WeMakeDevs, GitHub, Flagsmith) + watch the Flagsmith demo video
- Read the scenario and say whether it's too easy, too hard, or confusing
- **Codex task 1:** `ResultScreen.jsx`
- **Codex task 2:** `README.md`
- Test both versions on phone and laptop
- Share the game link to recruit players
- Screenshot Flagsmith results daily
- Star Flagsmith on GitHub

## 7. Git Workflow

### GitHub account & identity (strict)
For this project, only use this GitHub account:
- **GitHub username:** `psohi-byte`
- **Git email:** `prabhjeevsohi@gmail.com`

Rules:
- Use **local repository Git config only**. **Do not change global Git config.**
- Use **SSH** for GitHub pushes. **Do not use HTTPS remotes** for this project.
- **Do not push using any other GitHub account.**
- Do not use `https://github.com/...`
- Do not use `git@github.com:...`
- Use only: `git@github-psohi-byte:psohi-byte/QuietOps.git`
- The repo is new. Create it under the `psohi-byte` account first (e.g. `gh repo create psohi-byte/QuietOps --private`, or via github.com while signed in as psohi-byte), then add Michael as a collaborator.

Before committing or pushing, verify:
```
git config user.name
git config user.email
git remote -v
git status
git branch --show-current
```
Expected:
- `user.name` = `psohi-byte`
- `user.email` = `prabhjeevsohi@gmail.com`
- `origin` = `git@github-psohi-byte:psohi-byte/QuietOps.git`
- `branch` = `main` or a `feature/*` branch

**If the Git identity or remote is wrong, stop and tell the user before committing or pushing.**

### Team workflow
- Nobody pushes directly to `main`. Use one feature per branch and open a PR. The lead reviews and merges.
- Don't edit the other person's files without saying so first.
- Pull `main` before each session.

## 8. Timeline (PT)
| When | Lead | Michael |
|---|---|---|
| Wed night | Repo, skeleton, deploy, Flagsmith connected, warehouse checked | Sign-ups, demo video |
| Thu | Both dashboards, game screens, scenario JSON | Review scenario, ResultScreen |
| **Fri AM** | Events firing → **experiment LIVE** | Start recruiting players |
| Fri–Sat | Kill switch, remote config, polish, simulator | Recruit, test, screenshots, README |
| **Sat night** | Roll out winner, record demo, **submit** | Final testing |

## 9. Scope Rules
- **One scenario, one experiment, done well.** Get it live by Friday morning.
- Build the must-haves first. Extras only if ahead.
- Stretch ideas: more scenarios, a live results/funnel page, a leaderboard, a reusable "grouped alerts" component for teams.

## 10. Demo Video (~2.5 min)
Problem (alert fatigue) → play the game → show the Flagsmith flag splitting list vs grouped → kill switch / remote config → live results with win probability → roll out the winner.

## 11. First Steps for Claude Code
1. Confirm the plan and suggest any improvements.
2. Scaffold the React + Vite app and folder structure, then deploy a blank app.
3. Run Flagsmith's coding-agent setup prompt (link above) to create the flag, metric and experiment and wire up the SDK.
4. Build the scenario, dashboards and game flow.
5. Verify events reach Flagsmith, then start the experiment.
