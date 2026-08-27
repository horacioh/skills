---
name: quiz-time
description: Use when a developer wants to verify their understanding of a codebase, especially after AI-assisted changes or while becoming familiar with a repository.
license: Apache-2.0
---

# Quiz Time

Run a grounded, conversational codebase-comprehension quiz. The result is a learning checkpoint, not a certification or judgment of the developer.

## Inspect the repository

Treat the current working repository as the quiz target. Do not use this skill's own files, another readable repository, or external code as quiz evidence unless the user explicitly selects that scope.

Before asking a question, inspect enough project documentation, source code, tests, and configuration to understand the application. Focus on maintained first-party files; ignore generated output, vendored dependencies, caches, secrets, and unrelated artifacts.

Use executable code as the authority for runtime behavior, tests for intended protected behavior, configuration for composition, and documentation for stated purpose. If sources conflict, avoid the disputed premise or make the discrepancy explicit when it has one evidence-backed answer.

If the repository lacks enough evidence for five meaningful questions, stop and explain that a grounded quiz cannot be created. Never invent facts or pad the quiz with trivia.

## Prepare the quiz privately

Create the complete answer key before presenting Question 1. Prepare exactly five medium-difficulty questions, one for each area:

1. Application purpose or user-visible behavior
2. Architecture and component responsibilities
3. A primary execution, request, or data flow
4. An important implementation detail
5. A meaningful failure mode, invariant, or edge case

Each question must:

- Test a significant concept rather than a name, arbitrary constant, or gotcha.
- Have exactly four plausible options labeled A-D and exactly one correct answer.
- Be unambiguous and defensible from repository evidence.
- Require no unstated external knowledge.
- Add coverage instead of repeating another question.

Vary the correct option's position across the quiz. Keep future questions and the answer key private.

## Run one turn at a time

Show only:

```text
Question N of 5

[Question]

A. [Option]
B. [Option]
C. [Option]
D. [Option]

Choose A, B, C, or D.
```

Before the answer, do not provide hints, citations, conspicuously detailed wording, or other clues to the correct choice.

Accept an option letter or a clearly matching answer. If the response is ambiguous, ask the developer to choose one option without revealing anything.

After a clear answer:

1. State whether it is correct and identify the correct option.
2. Explain the relevant behavior concisely.
3. Explain distractors only where the distinction teaches something useful.
4. Cite supporting repository evidence with precise `path:line` references.
5. Show `Score: X/N answered`.
6. Present the next question, unless all five are complete.

An answered question is final after feedback reveals its answer; do not award credit for a retry.

## Report the result

After Question 5, report the score and percentage.

- **4/5 or 5/5:** `Understanding demonstrated`
- **Below 4/5:** `Understanding not yet demonstrated`

Briefly summarize demonstrated strengths, concepts to revisit, and the most relevant files for review. Keep the tone constructive. Do not claim that the result proves complete understanding or code quality.
