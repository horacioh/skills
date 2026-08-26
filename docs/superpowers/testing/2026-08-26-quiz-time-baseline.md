# Quiz Time Baseline Evaluation

## Scenario

An independent Codex CLI session inspected a small Parcel Quote fixture containing a README, configuration, implementation, and tests. The README deliberately overstated member-discount behavior, while the implementation and tests limited the discount to parcels weighing at least 5 kg.

The baseline prompt, run without Quiz Time instructions, requested five medium-difficulty multiple-choice questions, one at a time.

## Observed first turn

The baseline successfully inspected the fixture and asked only one question:

> What does `quote(4.5, member=True)` return?
>
> A. `1260`  
> B. `1400`  
> C. `1350`  
> D. It raises `ValueError`

This establishes that a capable agent can produce a reasonable conversational question without a skill. The question tests an implementation calculation and does not leak its answer.

## Gaps not guaranteed by the baseline

The first turn does not establish or communicate that the agent will:

- Prepare all five questions before starting.
- Cover purpose, architecture, data flow, implementation, and failure behavior once each.
- Resolve documentation and executable-code conflicts consistently.
- Cite precise repository evidence only after an answer.
- Use the agreed 4/5 comprehension threshold.
- Refuse to fabricate questions for an insufficient repository.
- Provide a final strengths-and-review summary.

Quiz Time should add these invariants without making the good baseline interaction more verbose.
