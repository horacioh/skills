---
name: pr-visual-explainer
description: Visually explain a pull request (goal, what changed, the decisions and why) as a self-contained interactive HTML page with diagrams, annotated diffs and decision cards, plus an optional narrated 1080p video. Scales depth to the change. Use when asked to explain, visualize, present, walk through or make a video or diagram of a PR or diff.
---

# PR visual explainer

Turns a PR into visuals a developer can absorb in minutes: what it is for, how the pieces fit before and after, the lines that matter, and why it was done this way. Every claim is checked against the real diff and files at the PR's commits.

The kit ships next to this file in `kit/`. Set `SKILL_DIR` to the directory containing this `SKILL.md` and install the kit's pinned dependencies:

```bash
KIT="$SKILL_DIR/kit"
(cd "$KIT" && npm ci)
```

If the installed skill is read-only, copy the whole `kit/` directory to a writable workspace first and point `KIT` at that copy.

- **Collect:** Bash, Git, and authenticated GitHub CLI (`gh`). Use Git Bash on Windows.
- **HTML:** Node.js 18+, npm, and Chrome or Chromium. The kit searches PATH and common Linux, macOS, and Windows locations. Set `CHROME` to the full executable path to override detection.
- **Video only:** FFmpeg with H.264 encoding and `ffprobe` on PATH. Narration uses Microsoft Edge's online speech service and sends the script text to it. Use `--silent` for offline video or if the script must stay local.

## 1. Collect: never explain from the title

```bash
mkdir -p ./pr-explainer && cd ./pr-explainer
bash "$KIT/collect.sh" "$REPO_CHECKOUT" "$PR_NUMBER" ./work     # PR_REPO=owner/repo if origin isn't github.com
```

This writes `work/pr.diff`, `numstat.tsv`, `commits.txt`, `discussion.md` (description, reviews, inline comments) and `meta.json`. It uses GitHub's recorded base/head SHAs, so the diff matches "Files changed" even after the base was rebased.

Then read, in this order:
1. `discussion.md` gives the stated goal, the alternatives raised, and review findings that changed the code.
2. `commits.txt`: later commits named "fix review" or "avoid X" usually mark a decision or a guard worth showing.
3. The whole diff except generated files, plus enough surrounding code at the head SHA (`git show <head>:<path>`) to know each changed function's callers and callees. A change is only understandable with its context: who calls it, when it runs, and what it replaced.
4. Tests in the diff. Their names are the cleanest list of intended behaviours and edge cases.

Write down for yourself: goal (user or system outcome), mechanism (what code now does), the decisions (with alternatives), risks, and how it was verified. If the why for a decision isn't in the PR, commits or thread, leave `why` empty. The page then says "Rationale not stated" rather than inventing one. Ask the user if they know.

## 2. Pick the depth from the change, not the line count

| Tier | Typical change | Blocks | Video |
|---|---|---|---|
| **S** | one behaviour, one or two files, local fix or rename | summary + one `code` (or `compare`) + `files` | no, unless asked |
| **M** | a feature or fix that crosses 2–4 functions/modules, or a new guard/flow | summary + one `diagram` with a 3–5 step tour + 1–2 `code` + `decision` if there was a real choice + `steps`/`callout` for rollout or risk + `files` | optional, about 60–90 s |
| **L** | new subsystem, data-model or API change, migration, cross-service flow, refactor that moves responsibilities | summary + architecture `diagram` (before→after via `removed`/`added`) + `sequence` for the runtime flow + 2–4 `code` + `decision`(s) + `metrics`/`screens` if measurable/visual + risks + `files` grouped by area | yes, about 2–3 min |

Push the tier up for subtle concurrency, security, data migration or ops changes even when small. Push it down for large but mechanical diffs (codemods, renames, generated code); show the rule and one example, and collapse the rest. Match the reader: an ops fix needs the runtime timeline, a UI change needs before/after screens, and a schema change needs fields with statuses.

Each block must answer a question a reviewer would ask. Cut any block that only restates another.

## 3. Write `spec.json`

```jsonc
{
  "tldr": "One or two sentences: the problem in user/system terms and what now happens.",
  "summary": { "goal": "…", "change": "…", "why": "…" },
  "blocks": [ /* in reading order; each has id, type, title, optional nav (short TOC label), kicker, lede */ ],
  "video": { "voice": "en-US-AndrewNeural", "scenes": [ /* optional, see 5 */ ] }
}
```

`pr` metadata (repo, number, title, author, state, SHAs, stats) comes from `work/meta.json`; don't type it.

Inline markdown in text fields: `` `code` ``, `**bold**`, `[link](https://…)`. Status everywhere is `added` / `changed` / `removed` (or omit). It renders as `+ New`, `~ Changed` and `− Removed` with a symbol and line style as well as a colour. The palette is colour-blind safe (Okabe-Ito), and readers must never need colour alone.

**Refs.** Anything with `ref` links to the file at the PR head (`base:path` for code that was deleted). Don't type line numbers. Give `find` (text on the line, or `["first line text", "last line text"]`). Diagram nodes can use `symbol`. The build resolves the real lines and fails if the text isn't there.

Block types (see [seed-43.json](kit/examples/seed-43.json) for a worked tier M example from the public `horacioh/seed` fork):

- `diagram`: `nodes` (`id`, `label`, `sub`, `kind`: module|file|function|db|ui|service|external|actor|job|config|test|api|cli|queue|state|doc|event|lock|cache, `status`, `ref`, `symbol`, `fields: [{name,type,status}]` for schemas). A node with `children` is a group. `edges` (`from`, `to` must be leaf nodes, `label`, `status`, `style: "dashed"`, `both`). `direction`: RIGHT for pipelines of ≤5 layers, DOWN otherwise. `narrowDirection` is used on phones. `steps: [{title, text, focus:[node ids], edges?}]` gives a guided tour that dims everything else. Aim for ≤ 12–15 nodes. Show only what the change touches plus one hop of context. Mark removed nodes and edges `removed` instead of drawing a separate "before" diagram.
- `sequence`: `participants: [{id,label,kind,status}]`, `messages: [{from,to,label,status,kind:"return"|"async", ref, find}]`, `{divider:"…"}`, `{note:"…", at:"participantId"}`. Use it when *order over time* is the point (requests, retries, cron, events).
- `code`: `file` and `pick: [{ from: "first line text", to: "last line text", label? }]`. This is a verbatim slice of the real hunk, so line numbers and +/− are exact. `notes: [{at: "text on a line", text}]` become numbered pins. Keep it to the 5–30 lines that carry the idea. Old-vs-new on the same function is the most useful excerpt.
- `decision`: `question`, `context`, `options: [{name, summary, pros, cons, chosen}]`, `why` (quote or paraphrase the source), `source` (URL). Include only options that were really considered or are the obvious alternative a reviewer would ask about.
- `steps`: `items: [{title, text, status, ref, find}]` for guard chains, rollout order and migrations.
- `compare`: `before`/`after` each with `title`, `points` or `text`, optional `image`.
- `callout`: `tone` note|risk|test, `title`, `text` (markdown, lists ok). Use it for risks, follow-ups and how it was tested.
- `metrics`: `items: [{label, before, after, unit, better: "lower"|"higher", source}]`. Only measured numbers, always with their source.
- `screens`: `items: [{src (path relative to spec), caption, status, tag}]` for UI PRs, or `manifest: "evidence/manifest.json"` (not both). Capture the same interaction and viewport on the base and head commits, using [repro-before-after](https://github.com/horacioh/skills/tree/main/skills/repro-before-after) when needed. Keep private data out of evidence. Don't depend on expiring PR-description image URLs.
- `files`: `areas: [{name, why, match?, files: [{path, note, order}]}]`. `match` is a regex that claims the remaining files it matches, which is useful for big PRs. `order` is the suggested review order. Stats come from the diff. Lockfiles, snapshots and dist are collapsed automatically (`collapse` regex to override). Any changed file you didn't place is added to "Other" with a warning, so nothing is silently hidden.

Writing: short, concrete sentences with real identifiers, values and log lines. Explain consequences ("every run redeployed"), not adjectives ("improves robustness"). No claim the diff doesn't support.

A screenshot manifest path is relative to `spec.json`. The screenshot paths are relative to the manifest, in its `before/` and `after/` directories (PNG, JPEG, or WebP). Pairs render in order, labeled Before and After, with the image bytes embedded in the HTML:

```json
{
  "version": 1,
  "pairs": [
    {
      "before": {"src": "before/1.png", "caption": "Save leaves the dialog open"},
      "after": {"src": "after/1.png", "caption": "Save closes the dialog and shows confirmation"}
    }
  ]
}
```

## 4. Build and look at it

```bash
node "$KIT/build.mjs" spec.json --work work --repo "$REPO_CHECKOUT" --out out
```

The build fails if a ref, `find`, `pick`, note anchor, edge endpoint or file isn't real in this PR. It warns on oversized diagrams, too many lines, missing rationale and unplaced files. It writes `out/index.html` (one self-contained file with fonts inlined; it works offline and as an attachment) and `out/shots/` (each block at desktop size, full page desktop light/dark, phone), and reports horizontal overflow.

**Open every image in `out/shots/` and check it**: labels clipped or wrapped mid-word, edges crossing nodes, a diagram scaled so small it's unreadable, a pin on the wrong line, dark-mode contrast. Fix the spec (split diagrams, change `direction`, shorten labels) and rebuild. Then reread every sentence against the diff once more.

## 5. Video (tier L, or when asked)

`video.scenes` is a list of `{ block?, say, step?, focus?, lines?: [from,to], items?: [...], draw?, hold? }`:
- The first scene has no `block`. It is the title card (repo, title, tldr).
- `step` replays a diagram tour step (camera zooms to its nodes and new edges draw in). `focus` gives ad-hoc node ids. `lines` are row indexes in a code block (0-based, gap rows count). `items` are step indexes to highlight.
- `say` is one or two spoken sentences. `*word*` gets the yellow caption highlight. Write numbers and symbols the way they should be spoken, and keep identifiers pronounceable or describe them ("the migration function").
- Aim for 60–90 s on M and 2–3 min on L. One idea per scene, in the page's order.

```bash
node "$KIT/video.mjs" out          # --theme dark, --fps 30, --silent
```

It narrates with Node.js and `msedge-tts` (sequential, with retries), times captions from speech boundaries and scenes from the audio after trimming long trailing silence, and renders 1920×1080 frames deterministically via `renderAt(t)`. It writes `out/explainer.mp4`, `out/timeline.json` and `out/video-shots/scene-NN.jpg` (the settled end of each scene). Look at those stills before sending.

## 6. Deliver

- Share `out/index.html` (it opens in a browser) and `out/explainer.mp4` if made. Add one or two key shots. Review all artifacts for content that shouldn't be shared; use only an authorized destination.
- If asked to post on the PR, include the TL;DR, a diagram PNG from `out/shots/`, and the HTML/video. Don't edit the PR description unless asked.
- Mention anything you couldn't verify (missing rationale, behaviour only visible at runtime) instead of smoothing it over.
