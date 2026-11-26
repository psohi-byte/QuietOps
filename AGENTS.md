# AGENTS.md: rules for Codex (and any coding agent) in this repo

## What this project is
**QuietOps** is a 60-second incident-response game for the Toggle Wars hackathon (Flagsmith).
A player sees ~25 alerts firing during a fake production outage and has to pick the root cause.
Half the players see a plain chronological alert list (control) and half see alerts grouped by root cause (`grouped`).
Flagsmith decides which version each player sees, and we measure which version helps more people find the right answer.

Stack: React 18 + Vite, plain CSS, `@flagsmith/flagsmith` JS SDK. No TypeScript, no CSS frameworks.

## Who owns what
| Path | Owner | Agents may edit? |
|---|---|---|
| `src/components/game/ResultScreen.jsx` (+ `ResultScreen.css`) | Michael | Yes, when working for Michael |
| `README.md` | Michael | Yes, when working for Michael |
| everything else (`src/App.jsx`, `src/lib/flagsmith.js`, dashboards, `data/`, `scripts/`, `CLAUDE.md`, this file) | Lead | **No.** Read them for context, but don't change them |

If a task seems to need a change in a lead-owned file, **stop and explain what change is needed** instead of making it.

## Hard rules
1. **Only edit the files the current task names.** Don't create, rename or delete other files.
2. **No new npm dependencies** unless the task says so.
3. **Never import or call Flagsmith** (`@flagsmith/flagsmith` or `src/lib/flagsmith.js`) from Michael's files. Experiment events are fired by the lead's code. Extra events from other files would corrupt the experiment data.
4. **Never commit secrets.** `.env.local` holds keys and is git-ignored. Never print, copy or commit its contents.
5. **Never push to `main`.** Always work on a `feature/<short-name>` branch and open a Pull Request.
6. **Run `npm run build` before committing.** It must succeed.
7. **Don't use `alert()`, `confirm()` or `prompt()`.** Show messages in the page instead.
8. **Explain the code simply.** Michael is new to coding and must be able to explain every line to the judges. After finishing, write a short plain-English summary of what each part does.

## Running the project
```bash
npm install
cp .env.example .env.local   # ask the lead for the key value; the app also runs without it
npm run dev                  # opens http://localhost:5173
npm run build                # must pass before every commit
```

## Tasks
Task instructions are in `tasks/michael/`. Do one task at a time, in order.
