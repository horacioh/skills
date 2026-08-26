# Quiz Time Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish a portable, single-file Agent Skill that runs a grounded five-question codebase comprehension quiz.

**Architecture:** `quiz-time/SKILL.md` is the complete product. Behavioral evaluation uses a temporary fixture repository and an independent Codex CLI session; the repository itself contains no runtime or test harness.

**Tech Stack:** Agent Skills Markdown, YAML frontmatter, Codex CLI, Git, GitHub CLI.

---

### Task 1: Establish the behavioral baseline

**Files:**
- Create temporarily: `/tmp/quiz-time-fixture/`
- Create: `docs/superpowers/testing/2026-08-26-quiz-time-baseline.md`

- [x] **Step 1: Create a small fixture repository**

Create a documented application with source, tests, configuration, and one deliberate documentation/implementation discrepancy.

- [x] **Step 2: Run the quiz request without Quiz Time**

Run an independent Codex CLI session against the fixture, requesting five one-at-a-time comprehension questions with no skill instructions.

- [x] **Step 3: Record observed behavioral gaps**

Document concrete failures such as missing private preparation, weak coverage guarantees, answer leakage, missing evidence rules, or no insufficient-repository behavior.

### Task 2: Write the minimal portable skill

**Files:**
- Create: `quiz-time/SKILL.md`

- [x] **Step 1: Implement valid discovery frontmatter**

Use the `quiz-time` name and a discriminating `Use when...` description covering codebase-comprehension checks after AI-assisted work or during repository familiarization.

- [x] **Step 2: Implement repository inspection and quiz preparation**

Require inspection of documentation, source, tests, and configuration; code wins conflicts. Require five privately prepared questions covering purpose, architecture, data flow, implementation, and failure behavior.

- [x] **Step 3: Implement the conversational state machine**

Ask one four-option question per turn, withhold citations until the answer, grade immediately, cite `path:line`, maintain the score, and report the 4/5 threshold.

- [x] **Step 4: Implement integrity boundaries**

Require one defensible answer, plausible distractors, no trivia or gotchas, varied correct-option positions, no score-changing retries, and honest refusal for insufficient repositories.

### Task 3: Validate the skill

**Files:**
- Modify if evaluation exposes gaps: `quiz-time/SKILL.md`
- Create: `docs/superpowers/testing/2026-08-26-quiz-time-evaluation.md`

- [x] **Step 1: Run structural validation**

Run the Agent Skill `quick_validate.py` validator against `quiz-time/` and check the working-tree diff for formatting errors and placeholders.

- [x] **Step 2: Run the fixture scenario with the skill**

Run an independent Codex CLI session with the fixture plus the completed skill and record whether its first turn follows the required interaction.

- [x] **Step 3: Evaluate an insufficient repository**

Run the skill against an empty temporary repository and confirm that it refuses to invent five grounded questions.

- [x] **Step 4: Fix only observed gaps and revalidate**

Keep the product as a single `SKILL.md`; do not add runtime machinery.

### Task 4: Commit and publish the test branch

**Files:**
- Modify: `docs/superpowers/plans/2026-08-26-quiz-time-skill.md`

- [ ] **Step 1: Mark completed plan steps**

Update checkboxes to reflect the verified work.

- [ ] **Step 2: Run final verification**

Run structural validation, placeholder scans, `git diff --check`, and inspect `git status`.

- [ ] **Step 3: Commit the implementation**

Commit the plan, evaluation notes, and `quiz-time/SKILL.md` together.

- [ ] **Step 4: Create the GitHub repository and push**

Use the embedded GitHub CLI to create `horacioh/quizz-time-skill` and push the current branch without creating a release.
