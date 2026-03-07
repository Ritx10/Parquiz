## Commit Message Rule

All git commit messages in this repository must be written in English.

This rule applies even when the user gives instructions in another language, for example "haz commit y push de los cambios".

When committing on behalf of the user, always keep the commit title and body in English to preserve repository consistency.

## Atomic Commit Rule

Commits should follow an atomic commit convention.

Group files into small, coherent commits that represent a single step of progress, so the history reads as if the project was built gradually.

Use a clear English prefix that matches the intent of the change, such as `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `build:`, `ci:`, or another precise prefix when appropriate.

Prefer commit messages whose type and wording reflect the purpose of the change, not just the files touched.

## Package Manager Rule

Do not use `npm` in this repository.

Use `bun` as the default package manager for installing dependencies, running scripts, and executing frontend workflows.

When a package manager command is needed, prefer `bun install`, `bun run`, `bunx`, and other Bun-native equivalents.
