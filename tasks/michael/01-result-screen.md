# Task 1: ResultScreen

**Branch:** `feature/result-screen`
**Files you may create/edit:** `src/components/game/ResultScreen.jsx` and `src/components/game/ResultScreen.css`. **Nothing else.**

## What it is
The screen a player sees right after they answer (or run out of time). It tells them whether they found
the root cause, how long it took, and lets them share their result or play again.

The lead's `src/App.jsx` already loads this file automatically as soon as it exists. You don't need to
change App.jsx (and must not).

## The contract (must match exactly)
`ResultScreen.jsx` must **default-export** a React function component that accepts these props:

| Prop | Type | Meaning |
|---|---|---|
| `correct` | boolean | `true` if the player picked the right root cause |
| `seconds` | number | how many seconds they took (whole number) |
| `rootCause` | string | the real root cause, e.g. `"db-primary"` |
| `timedOut` | boolean (optional, default `false`) | `true` if the timer ran out before they answered |
| `onPlayAgain` | function | call this when the player clicks "Play again" |
| `players` | number (optional) | how many people have played so far. `undefined` when unknown |

```jsx
export default function ResultScreen({ correct, seconds, rootCause, timedOut = false, onPlayAgain, players }) { ... }
```

The lead's `App.jsx` already passes `players` (it reads the count from the results API). You only display it.

## What to show
1. **A big headline** depending on the outcome:
   - correct → e.g. "Root cause found" (green, `var(--accent)`)
   - wrong → e.g. "Wrong call" (red, `var(--critical)`)
   - timedOut → e.g. "Out of time" (amber, `var(--warning)`)
2. **The time**: e.g. "in 23s". Don't show a time when `timedOut` is true.
3. **The real root cause**, always shown: e.g. "The real root cause was **db-primary**." Show `rootCause` in a `<code>` tag.
4. **One short line of context**: something like "In real outages, most alerts are symptoms. The trick is finding the one that caused the rest." Keep it to one sentence.
5. **Player-count line** (this is what gets people to share; show it just above the buttons):
   - When `players` is a number: `You're one of {players} on-call engineers who took this shift.`
     and under it, smaller: `Can your friends beat 60 seconds?`
   - When `players` is `undefined`: show only `Can your friends beat 60 seconds?`
   - **Never** mention versions, variants, groups, "A/B", other players' scores or success rates. Players must not
     find out there are two versions; it would spoil the experiment.
6. **Two buttons:**
   - **Share**: see below
   - **Play again**: calls `onPlayAgain()`

## Share button
- Share text (correct): `I found the root cause of a production outage in {seconds}s on QuietOps. Can you beat it? (no spoilers!)`
- Share text (wrong / timed out): `Production went down and I couldn't find the root cause in time. Can you? QuietOps (no spoilers!)`
- **The share text must never include the root cause.**
- Add the game link to the end: `window.location.origin`
- If `navigator.share` exists (phones), use it: `navigator.share({ title: 'QuietOps', text, url })`.
  If the user cancels the share sheet, do nothing (catch the error silently).
- Otherwise copy `text + ' ' + url` with `navigator.clipboard.writeText(...)`, then change the button
  label to "Copied!" for 2 seconds. If copying fails, show the text in a small box so they can copy it by hand.
- **No `alert()`.**

## Style
- Put styles in `ResultScreen.css` and `import './ResultScreen.css'` at the top of the component.
- Use the colour variables already defined in `src/styles.css`: `--bg`, `--panel`, `--text`, `--muted`,
  `--critical`, `--warning`, `--accent`. Don't hard-code new colours.
- Centered card, max width ~480px, works on a phone (375px wide) with no sideways scrolling.
- Buttons at least 44px tall (easy to tap on a phone).
- Give every CSS class a `result-` prefix (e.g. `.result-card`) so it can't clash with other screens.

## Don't
- Don't import Flagsmith or `src/lib/flagsmith.js`, and don't send any analytics or events. (The lead's code does that. Extra events would break the experiment.)
- Don't add npm packages.
- Don't change any other file.

## How to check it
Run `npm run dev`, then open each of these and check they look right on desktop **and** with the
browser's phone view (DevTools → device toolbar → iPhone):
- http://localhost:5173/?preview=result&correct=1&seconds=23
- http://localhost:5173/?preview=result&correct=0&seconds=41
- http://localhost:5173/?preview=result&timedout=1
- http://localhost:5173/?preview=result&correct=1&seconds=23&players=47 → shows "You're one of 47 on-call engineers…"
- The first three links have no `players`, so they must show only "Can your friends beat 60 seconds?"
- Click **Share** on desktop → button says "Copied!" and the text pastes correctly.
- Click **Play again** → the browser console (F12) shows `[preview] play again clicked`.
- `npm run build` succeeds.

## When done
Commit with a clear message, push `feature/result-screen`, open a Pull Request to `main`, and post a
screenshot of each of the three states in the PR description.
