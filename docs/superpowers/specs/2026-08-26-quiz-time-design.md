# Quiz Time Skill Design

## Context

AI coding agents can produce substantial changes faster than developers can absorb them. A developer may approve or ship code without understanding the application's behavior, architecture, data flow, or failure modes. Quiz Time is intended to turn repository comprehension into an explicit, lightweight checkpoint.

The skill does not try to prove expertise conclusively. It provides practical evidence that the developer can answer grounded questions about the code currently in front of them and directs them to gaps when they cannot.

## Goal

Create a portable Agent Skill that examines the current repository and runs a short, conversational multiple-choice quiz. The experience should help a developer verify that they understand what the application does and how its important internals work.

The first version should be useful after AI-assisted coding as well as during general codebase familiarization, without requiring an application, service, generated artifact, or external dependency.

## MVP Decisions

- Deliver the skill as one portable `SKILL.md` file.
- Invoke it explicitly using the host agent's normal skill or command syntax.
- With no scope supplied, quiz the whole current codebase.
- Ask exactly five questions, one question per conversational turn.
- Provide four plausible options labeled A-D.
- Give immediate feedback after each response.
- Ground explanations in repository paths and line numbers.
- Use source code, tests, configuration, and project documentation as evidence.
- Prefer executable code when documentation and implementation disagree.
- Balance questions across product behavior and internal implementation.
- Treat 4/5 or 5/5 as **Understanding demonstrated**.
- Keep the interaction constructive and educational rather than punitive.

## Non-goals

The MVP will not:

- Quiz a selected file, directory, symbol, comment, diff, commit, branch, pull request, or staged changes.
- Ask the user to select a topic, difficulty, or question count.
- Generate a Markdown report or interactive HTML page.
- Persist quiz attempts or analytics outside the conversation.
- Use scripts, an application runtime, or a machine-readable quiz database.
- Modify the repository being examined.
- Claim that a passing score certifies complete understanding or code quality.

## User Experience

### Starting a quiz

The developer explicitly invokes Quiz Time in a repository. The portable skill source remains the same even if hosts expose skills differently, such as a skill mention or slash-command-like interface.

The skill briefly states that it is examining the repository. It should not burden the user with configuration questions in the MVP.

### Repository inspection

Before asking anything, the agent examines enough of the repository to build a reliable mental model. It considers:

- Project documentation for stated purpose and usage.
- Entry points and source code for actual behavior.
- Tests for expected behavior and edge cases.
- Configuration for runtime composition and important integrations.

Generated files, vendored dependencies, build outputs, caches, secrets, and unrelated large artifacts should not drive questions. The agent should favor important, supported behavior over obscure trivia.

If the repository is empty or does not contain enough evidence for five meaningful questions, the agent stops and explains why. It must not invent facts to complete the quiz.

### Private quiz preparation

The agent prepares all five questions and the answer key before displaying the first question. Doing so helps it achieve balanced coverage and prevents the quiz from drifting toward whatever file it most recently read.

The five questions cover:

1. Application purpose or user-visible behavior.
2. Architecture and component responsibilities.
3. A primary execution, request, or data flow.
4. An important implementation detail.
5. A meaningful failure mode, invariant, or edge case.

The agent keeps future questions and answers private. Correct choices should appear in varied positions rather than following a predictable pattern.

### Question turns

Each turn shows:

- `Question N of 5`
- One focused question.
- Four options labeled A-D.
- A prompt to choose one answer.

Before the user answers, the question must not include citations, hints, conspicuously detailed wording, or other clues that reveal the correct option.

Questions should test understanding that matters to working on the project. They should be medium difficulty: answering should require reading or understanding the repository, but not remembering arbitrary constants, incidental names, or gotchas. Distractors must be plausible and unambiguously wrong according to repository evidence.

### Grading turns

The skill accepts a letter or a sufficiently clear matching response. It then:

1. Says whether the answer was correct.
2. Identifies the correct answer.
3. Explains the relevant behavior concisely.
4. Explains wrong alternatives when doing so teaches a useful distinction.
5. Cites supporting repository paths and line numbers.
6. Shows the running score.
7. Continues to the next question.

Once feedback exposes the answer, that question is final; the developer cannot change it for credit. If a response is ambiguous, the skill asks the user to choose one option without revealing anything.

### Final result

After question five, the skill reports:

- Final score and percentage.
- **Understanding demonstrated** for scores of 4/5 or 5/5.
- **Understanding not yet demonstrated** for scores below 4/5.
- A short summary of demonstrated strengths.
- Specific concepts and relevant files to revisit.

The result is a learning aid, not a certification. It should never shame the developer or equate one quiz result with overall competence.

## Evidence and Conflict Rules

Every correct answer must be defensible from inspected repository content. Explanations use clickable file references where the host supports them and otherwise use precise `path:line` citations.

Evidence priority is contextual rather than absolute, with these defaults:

1. Executable implementation for current runtime behavior.
2. Tests for intended and protected behavior.
3. Configuration for composition and environment-specific behavior.
4. Documentation for stated purpose and usage.

When these sources conflict, the question must not pretend the conflict does not exist. The agent should either avoid the disputed premise or explicitly ask about the discrepancy when it is important and has one clearly grounded answer.

## Question Quality Constraints

A valid question:

- Covers a significant project concept.
- Has exactly one correct answer.
- Can be graded from repository evidence.
- Uses plausible distractors from nearby concepts or realistic misconceptions.
- Does not depend on unstated external knowledge.
- Does not rely on a trick, ambiguous wording, or microscopic trivia.
- Does not reveal its answer through option length, grammar, citations, or framing.
- Adds coverage rather than repeating another question in different words.

The agent should avoid asking what a function is named when it can instead ask what behavior or responsibility that function implements.

## Architecture

The MVP is intentionally a single instruction file:

```text
quiz-time/
└── SKILL.md
```

The skill contains:

- Agent Skills frontmatter for discovery.
- Trigger and scope guidance.
- Repository inspection rules.
- Quiz construction and quality rules.
- The conversational state machine.
- Scoring and final-report requirements.

No script is required. The host conversation holds the question index, responses, and score. This is sufficient for five turns and keeps the skill portable.

## Alternatives Considered

### Conversational examiner — selected

The agent asks one question per turn and keeps state in the conversation.

Advantages:

- Matches the intended learning experience.
- Allows immediate, contextual feedback.
- Requires only one portable Markdown file.
- Avoids revealing later questions or answers.
- Is easy to extend with scopes later.

Trade-off:

- Results are not persisted independently of the conversation.

### Generated Markdown or HTML quiz — deferred

The agent could generate a shareable document or a self-contained interactive page.

Advantages:

- More visual and shareable.
- Can be revisited outside the agent session.
- Could combine a codebase explanation with the quiz.

Trade-offs:

- Does not naturally support the chosen one-question-per-turn interaction.
- Requires generated files and, for interactivity, HTML/CSS/JavaScript.
- Adds output-format concerns unrelated to validating understanding.

This remains a promising future mode rather than part of the core MVP.

### Structured quiz engine — rejected for MVP

A script and structured question format could manage state, saved attempts, or analytics deterministically. Those benefits do not justify multiple files and extra machinery for a five-question conversational quiz.

## Related Work and Inspiration

The most relevant example found during initial research is Geoffrey Litt's [`explain-diff-html` skill](https://gist.github.com/geoffreylitt/a29df1b5f9865506e8952488eac3d524). It generates a rich explanation of a change and ends with five interactive, medium-difficulty multiple-choice questions. It shares the principles of testing substantive understanding, avoiding gotchas, and giving answer feedback.

Quiz Time differs by making comprehension assessment the primary workflow, operating conversationally, scoring the result, grounding feedback in repository citations, and initially covering the whole codebase rather than a specific diff.

Initial GitHub searches for codebase quizzes, source-code quiz generators, repository onboarding quizzes, and LLM code-comprehension questions mostly surfaced generic educational quiz generators or repository chat tools. No close open-source equivalent was identified in that first pass. This is not evidence that none exists; broader research should continue before positioning the project as unique or choosing an upstream contribution target.

## Future Ideas

Possible extensions, intentionally excluded from the MVP:

- Scope selectors for files, directories, symbols, comments, diffs, staged or unstaged changes, commits, branches, and pull requests.
- Topic presets such as architecture, implementation, product behavior, testing, security, performance, or failure handling.
- User-selected question count and difficulty.
- Adaptive difficulty based on earlier answers.
- Hints with a scoring penalty.
- Free-response questions and requests to predict runtime behavior.
- A generated Markdown or self-contained HTML study guide and quiz.
- Saved results, progress over time, team onboarding paths, or CI/PR comprehension gates.
- A pre-quiz explanation mode for unfamiliar repositories.
- Re-quizzing only the concepts the developer missed.

Future options should preserve the central invariant: questions and grading must remain grounded in the selected repository evidence.

## Testing Strategy

Because the deliverable is an instruction skill, tests should evaluate behavior rather than exact wording.

Use representative fixture repositories or temporary sample projects to verify that an agent using the skill:

1. Inspects source, tests, configuration, and documentation before questioning.
2. Produces five distinct questions covering the required categories.
3. Asks only one question at a time and withholds the answer beforehand.
4. Uses four plausible options with one evidence-backed answer.
5. Grades clear letter and text answers correctly.
6. Provides accurate `path:line` evidence after each answer.
7. Maintains the score across all turns.
8. Applies the 4/5 passing threshold.
9. Refuses to fabricate a quiz for an empty or insufficient repository.
10. Avoids generated, vendored, secret, or irrelevant content.

Baseline testing should first run the same quiz request without the skill and document failures such as trivia-heavy questions, missing citations, answer leakage, uneven coverage, or invented facts. The minimal skill should then address observed failures and be retested on a different repository to reduce overfitting.

## Success Criteria

The MVP is successful when:

- It is valid as a portable Agent Skill and consists of one `SKILL.md` file.
- A developer can explicitly start it in a supported coding agent.
- It completes a five-question, one-at-a-time quiz without external tooling.
- Questions cover the agreed balanced areas and are supported by the repository.
- Feedback teaches the relevant behavior with precise code references.
- The final assessment uses the agreed threshold and identifies useful review areas.
- The skill handles insufficient repositories honestly.

## Open Questions for Later Iterations

- Which scope syntax should work consistently across different agents?
- Should generated HTML be a separate skill or an output mode of Quiz Time?
- Should the default quiz focus on the whole repository or recent AI-authored changes once scopes exist?
- How should large monorepositories be sampled without producing shallow questions?
- What evidence would justify stronger claims about demonstrated understanding?
- Is there an existing open-source project with an aligned roadmap that would benefit more from contribution than a separate skill?
