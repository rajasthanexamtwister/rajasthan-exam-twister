# AI_RULES.md — Rules for Any Coding Agent Working on This Repo

## Before Writing Any Code

Read, in full, in this order:
1. `README.md`
2. `PROJECT_PDR.md`
3. `ARCHITECTURE.md`
4. `DATABASE.md`
5. `API_SPEC.md`
6. `CONTENT_IMPORT.md`
7. `SECURITY.md`
8. `DEVELOPMENT_PLAN.md`

## Before Changing Code

1. Inspect the existing implementation before adding anything new.
2. Identify what's already built for the feature you're touching.
3. Do not rebuild working features.
4. Do not delete working code without an explicit reason stated in your response.
5. Do not change architecture (folder structure, DB provider, auth approach, etc.) without justification — and if you do, update the relevant doc in the same change.
6. Preserve database compatibility — additive migrations only unless a breaking change is explicitly requested.
7. Never expose secrets in code, logs, comments, or responses.
8. Never hard-code credentials, API keys, or tokens.

## While Implementing

9. Implement in small batches, following `DEVELOPMENT_PLAN.md`'s order — do not skip ahead to a later batch.
10. Run the test suite after each batch.
11. Run typecheck (`tsc --noEmit`) after each batch.
12. Run a production build (`next build`) after each batch.
13. Update the relevant doc(s) in this pack whenever architecture, schema, or API contracts change.
14. Do not claim a task is complete without having actually run and passed the checks in 10–12.
15. Do not mark a task complete if it was only partially implemented — say explicitly what's left.

## Handling Ambiguity

**When a requirement is ambiguous: do not guess silently.** State the assumption you're making, explain why it's the safest option, and proceed — don't block on it unless the ambiguity is safety- or data-loss-critical (in which case, ask).

## Scope Discipline

- Do not implement social media automation (Telegram/Instagram/X/Threads) in this phase — only preserve the `ContentService` boundary described in `ARCHITECTURE.md`.
- Do not add authentication providers, RBAC, or multi-admin support beyond the single-admin model unless explicitly requested.
- Do not introduce new dependencies not implied by this spec pack without flagging them explicitly.
- Do not add AI-generated-content features.

## Working With Legacy/Imported Content

- Any code path touching uploaded or imported HTML must sanitize before persisting — never render or store raw imported HTML.
- Never execute or evaluate any script found in imported content.
