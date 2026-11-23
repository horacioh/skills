# Skills

Portable agent skills for developers who want to understand and stay in control of AI-assisted work.

The files in this repository are intentionally simple: read them, copy them, adapt them, and make them your own.

## Available skills

### [Quiz Time](./skills/quiz-time/SKILL.md)

Quiz Time reads the current codebase and runs a five-question, multiple-choice comprehension check. It helps a developer verify that they understand what an application does, how its important parts fit together, and where meaningful edge cases live.

The quiz:

- Examines source code, tests, configuration, and documentation.
- Asks one question at a time.
- Covers purpose, architecture, data flow, implementation, and failure behavior.
- Explains each answer with repository references.
- Reports whether understanding was demonstrated using a 4/5 threshold.

### [PR Visual Explainer](./skills/pr-visual-explainer/SKILL.md)

Turn a pull request into a self-contained HTML walkthrough with diagrams, annotated diffs, and decision notes. The kit checks excerpts and references against the actual PR and can also render a narrated video.

### [Repro Before/After](./skills/repro-before-after/SKILL.md)

Reproduce a reported bug on the affected target, agree on what success looks like, and verify the same steps on the final code. An optional screenshot manifest lets you bring before/after evidence into a PR Visual Explainer.

## Installation

### Skills CLI

Install the skill you want with `npx`:

```bash
npx skills add horacioh/skills --skill quiz-time
npx skills add horacioh/skills --skill pr-visual-explainer
npx skills add horacioh/skills --skill repro-before-after
```

The commands install agent skills; they don't generate an explainer or run a reproduction. Ask your agent to use the installed skill in your project. PR Visual Explainer lists its kit setup and video requirements in its `SKILL.md`.

### Codex skill installer

Ask Codex to install the skill from this repository:

```text
$skill-installer

Install quiz-time from:
https://github.com/horacioh/skills/tree/main/skills/quiz-time
```

### Manual installation

Clone this repository and copy or symlink the skill into your agent's personal skills directory. The shared `.agents/skills` location works with Codex, OpenCode, Gemini CLI, Cursor, Zed, Pi, and other Agent Skills-compatible tools.

Replace `quiz-time` in the examples with the skill you want. Copy the whole directory so any supporting files come with it.

For compatible agents:

```bash
git clone https://github.com/horacioh/skills.git
cd skills
mkdir -p ~/.agents/skills
cp -R skills/quiz-time ~/.agents/skills/quiz-time
```

For local development, use a symlink so edits take effect without copying again:

```bash
ln -s "$PWD/skills/quiz-time" ~/.agents/skills/quiz-time
```

Start a new agent session if an installed skill does not appear immediately.

Claude Code uses its own personal skills directory. Install the same portable files there:

```bash
mkdir -p ~/.claude/skills
cp -R skills/quiz-time ~/.claude/skills/quiz-time
```

## Agent compatibility

The skills follow the open [Agent Skills specification](https://agentskills.io/specification). They use standard `SKILL.md` frontmatter and no agent-specific tools. The matrix below tracks Quiz Time specifically.

| Agent | Support | Personal installation | Explicit invocation |
|---|---|---|---|
| [OpenAI Codex](https://developers.openai.com/codex/skills) | Tested | `~/.agents/skills/quiz-time/` | `$quiz-time` |
| [Claude Code](https://code.claude.com/docs/en/skills) | Compatible | `~/.claude/skills/quiz-time/` | `/quiz-time` |
| [OpenCode](https://opencode.ai/docs/skills/) | Compatible | `~/.agents/skills/quiz-time/` | Ask OpenCode to use `quiz-time` |
| [Gemini CLI](https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/skills.md) | Compatible | `~/.agents/skills/quiz-time/` | Ask Gemini to activate `quiz-time` |
| [Cursor](https://cursor.com/docs/context/skills) | Compatible | `~/.agents/skills/quiz-time/` | Ask Cursor to use `quiz-time` |
| [Zed](https://zed.dev/docs/ai/skills) | Compatible | `~/.agents/skills/quiz-time/` | `/quiz-time` or `@quiz-time` |
| [Pi](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/skills.md) | Compatible | `~/.agents/skills/quiz-time/` | `/skill:quiz-time` |
| [Hermes Agent](https://github.com/NousResearch/hermes-agent) | Compatible | Agent Skills directory | `/quiz-time` |

“Tested” means the full five-question flow has been completed in that agent. “Compatible” means the agent documents support for the open skill format, but Quiz Time still needs a complete manual verification there before being promoted to tested.

Grok is a model family rather than a separate skill runtime in this matrix. Quiz Time works with a Grok model when it runs inside a compatible agent such as OpenCode.

## Repository structure

Each skill lives in its own directory and is independently readable and installable:

```text
skills/
├── pr-visual-explainer/
│   ├── SKILL.md
│   └── kit/
├── quiz-time/
│   ├── SKILL.md
│   └── docs/
└── repro-before-after/
    ├── SKILL.md
    └── record-pair.mjs
```

`SKILL.md` is the usable skill. Supporting scripts, examples, or notes live beside it.

## License

Licensed under the [Apache License 2.0](./LICENSE). You may use, modify, and redistribute these skills under its terms.
