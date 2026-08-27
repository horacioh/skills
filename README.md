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

Invoke it in Codex with:

```text
$quiz-time
```

## Installation

### Codex skill installer

Ask Codex to install the skill from this repository:

```text
$skill-installer

Install quiz-time from:
https://github.com/horacioh/skills/tree/main/skills/quiz-time
```

### Manual installation

Clone this repository and copy or symlink the skill into your agent's personal skills directory.

For Codex:

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
