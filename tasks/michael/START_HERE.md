# Michael: start here

Hi Michael! You have two coding tasks. Codex will do the typing; your job is to give it the task,
check the result looks right, and make sure you understand what it built.

## One-time setup (about 10 minutes)
1. Accept the GitHub invite to `psohi-byte/QuietOps` (check your email or https://github.com/notifications).
2. Install **Node.js 20+** from https://nodejs.org if you don't have it (`node --version` to check).
3. Clone the repo and install:
   ```bash
   git clone https://github.com/psohi-byte/QuietOps.git
   cd QuietOps
   npm install
   npm run dev
   ```
   Open http://localhost:5173. You should see the QuietOps intro screen.
   (It works without a Flagsmith key. You don't need one for your tasks.)

## How to do each task
1. Make sure you're up to date: `git checkout main && git pull`
2. Open Codex in the `QuietOps` folder.
3. Paste this into Codex (change the file name for each task):

   > Read `AGENTS.md`, then read `tasks/michael/01-result-screen.md` and do exactly what it says.
   > Follow every rule in AGENTS.md. When you're done, explain what you built in simple terms.

4. Check the result yourself using the "How to check it" section of the task.
5. Ask Codex to commit, push the branch and open a Pull Request (the task file says the branch name).
   If Codex can't open the PR, go to https://github.com/psohi-byte/QuietOps and click **Compare & pull request**.
6. Tell the lead the PR is ready. **Don't merge it yourself.** The lead reviews and merges.

## Your tasks (in order)
1. `tasks/michael/01-result-screen.md`: the screen players see after answering
2. `tasks/michael/02-readme.md`: the project README judges will read

## Non-coding jobs (from the plan)
- Sign up for the hackathon on WeMakeDevs and watch the Flagsmith demo video
- Play the game on phone and laptop once it's deployed; report anything broken or confusing
- Share the game link to recruit players (Flagsmith / WeMakeDevs Discords, friends)
- Screenshot the results once a day: https://quiet-ops-kohl.vercel.app/results (and the Flagsmith experiment
  page if you have access). The current experiment is **#795**; ignore the old #595 and #610.
- Star Flagsmith on GitHub: https://github.com/Flagsmith/flagsmith
