---
name: repro-before-after
description: Reproduce a reported bug on the affected target, state observable acceptance criteria, and capture comparable before and after evidence. Use when investigating a bug, verifying a fix, or preparing evidence for a review.
---

# Reproduce, then show before and after

## 1. Agree on what to reproduce

Read the report, discussion, and any attached evidence. Separate stated facts from assumptions. Write down:

- **Actual:** What the reporter observed, including useful errors or visible states.
- **Expected:** What should happen instead.
- **Steps:** The minimum sequence starting from known conditions. Record the app, revision/build, OS/device, browser, viewport, account state, flags, and data that affect the result.
- **Acceptance criteria:** Observable outcomes that distinguish the failure from the expected behavior.

Use the reported target, not the easiest stand-in. Browser device emulation can verify an emulated web session; it does not prove behavior in a native app or on physical hardware. Name the real device, browser, simulator, or emulator used, and label what it cannot establish.

## 2. Reproduce and capture before

Run the exact steps against the failing version before editing. Confirm the reported symptom itself, not just a similar failure. Note the revision, steps, observed result, and evidence. For a UI bug, capture the visible failing state or record the interaction if a still cannot show it. For a non-visual bug, save relevant test output, logs, or measured behavior.

If the symptom does not reproduce or the target or expected behavior is unclear, stop. Report what you tried and ask specific questions that distinguish the remaining explanations: exact build/device, step or starting state, sample input, expected outcome, or a short recording. Do not guess at a fix or quietly switch targets.

Use disposable accounts and sanitized fixtures. Store evidence outside the checkout unless the project requires otherwise. Before sharing, inspect the images, recordings, captions, and logs for credentials, private data, and identifying details; redact or recapture if needed.

## 3. Verify and capture after

After the fix, rerun the same steps on the final code with the same target, viewport, data, and starting state. Match the frame or interaction in the before evidence. Verify each acceptance criterion and relevant adjacent behavior, then run the project's affected checks. A successful build, green unit test, or page that merely loads is not proof of the original interaction.

Report the target and revisions, steps, before and after results, acceptance criteria, checks, and evidence paths. If verification fails or the necessary target is unavailable, say what remains unverified; do not claim it is fixed.

## Optional: A screenshot manifest for a PR explainer

Capture the screenshots using the tools appropriate to the reported target (for example, Playwright on web). After checking that they are safe to share, use the dependency-free Node 18+ helper next to this file to copy one pair into an evidence directory:

```bash
node "$SKILL_DIR/record-pair.mjs" ./evidence ./failing.png ./fixed.png \
  "Save leaves the dialog open" "Save closes the dialog and shows confirmation"
```

Here `$SKILL_DIR` is the directory containing this `SKILL.md`. The helper does not run the reproduction or redact evidence. Run it again to append another pair.

`evidence/manifest.json` is versioned and ordered. Each pair has a `before` and an `after` entry, each with a caption and a relative PNG, JPEG, or WebP path under the corresponding state directory:

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

In [pr-visual-explainer](https://github.com/horacioh/skills/tree/main/skills/pr-visual-explainer), add a `screens` block with `"manifest": "evidence/manifest.json"` (relative to the explainer's spec). It embeds the screenshots and labels them Before and After.
