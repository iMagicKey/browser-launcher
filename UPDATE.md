# UPDATE — imagic-browser-launcher

> Audit performed: 2026-04-07. Version at time of audit: 1.0.3

---

## Tests

Tests exist (`tests/launcher.test.js`) but are incomplete. Add:

- [ ] `getRandomPort()` returns a number within the valid port range (1024–65535)
- [ ] `launchTimeout` limits the wait time

---

## API improvements (minor bump)

- [ ] **Extract `getRandomPort.js` to `imagic-utils`** — a general utility with no browser dependency, duplication in the ecosystem. Either add as a Node-only export in utils, or document the intentional zero-dep decision.
- [ ] **Make `kill()` async** — currently the function is synchronous but is called via `await`. Explicitly document or make it `Promise`-based for consistency.
- [ ] **JSDoc** on all public methods: `launch()`, `kill()`, `isDebuggerReady()`, `waitUntilReady()`, `getFlags()`
- [ ] Expand README: add an API section describing all constructor parameters

---

## Backlog

- [ ] Support for browsers other than Chromium (Firefox via `--remote-debugging-port`)
- [ ] Export `LauncherOptions` type for TypeScript projects
- [ ] Graceful shutdown on `SIGTERM`: wait for the browser to finish before kill()
