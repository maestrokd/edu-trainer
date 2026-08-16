---
name: test-coverage
description: Use when implementing, reviewing, or proposing frontend tests in this repository to apply the minimal necessary Vitest coverage policy and decide when broader or integration testing must be deferred.
---

# Test Coverage

Prioritize production code. Add tests only when the user requests them, a focused test is needed to prove risky behavior, or a bug fix needs a regression guard.

## Workflow

1. Identify the smallest user-visible or service contract that needs proof.
2. Prefer an existing colocated test and avoid duplicate scenarios.
3. Add one representative success case when the path is not already covered.
4. Add one test per materially distinct error or regression branch.
5. Stop when the changed behavior is convincingly protected.

Use Vitest and Testing Library. Assert public results, rendered behavior, and important side effects rather than component internals. Keep tests next to the code they verify.

Do not test trivial passthroughs, library guarantees, or broad parameter matrices. Do not create or run integration tests, browser containers, Docker, or end-to-end infrastructure unless the user explicitly requests them.
