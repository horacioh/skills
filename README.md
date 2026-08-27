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

## Installation

### Codex skill installer

Ask Codex to install the skill from this repository:

```text
$skill-installer

Install quiz-time from:
https://github.com/horacioh/skills/tree/main/skills/quiz-time
```

### Manual installation

Clone this repository and copy or symlink the skill into your agent's personal skills directory. The shared `.agents/skills` location works with Codex, OpenCode, Gemini CLI, Cursor, Zed, Pi, and other Agent Skills-compatible tools.

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

Quiz Time follows the open [Agent Skills specification](https://agentskills.io/specification). It uses standard `SKILL.md` frontmatter, textual interaction, relative paths, and no agent-specific tools.

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
└── quiz-time/
    ├── SKILL.md
    └── docs/
```

`SKILL.md` is the usable skill. Supporting design and evaluation notes, when present, live beside that skill under `docs/`.

## License

Licensed under the [Apache License 2.0](./LICENSE). You may use, modify, and redistribute these skills under its terms.
