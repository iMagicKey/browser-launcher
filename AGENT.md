# AGENT — imagic-browser-launcher

## Purpose

Launch a Chromium-based browser process with remote debugging and manage its lifecycle (spawn, readiness polling, kill, signal cleanup).

## Package

- npm: `imagic-browser-launcher`
- import (local): `import Launcher from '../src/index.js'`
- import (installed): `import Launcher from 'imagic-browser-launcher'`
- zero runtime deps (uses `node:child_process`, `node:fs`, `node:net`, `node:http`)

## Exports

### `default` — `Launcher` class

The only export. Default export only (no named export).

```js
import Launcher from 'imagic-browser-launcher'
```

---

## Constructor

### `new Launcher(options?)`

| Option | Type | Default | Notes |
|--------|------|---------|-------|
| `browserPath` | `string` | `'/usr/bin/chromium'` | Absolute path to browser binary |
| `port` | `number \| null` | `null` | Debugging port; `null` = auto-assign random free port at launch |
| `profileDir` | `string` | `'/tmp/chromium-profile'` | Passed as `--user-data-dir` |
| `url` | `string` | `'about:blank'` | Appended as last CLI arg |
| `flags` | `string[]` | `[]` | Extra CLI flags; auto-injected flags not duplicated |
| `launchTimeout` | `number` | `10000` | ms to wait for debugger port |
| `debug` | `boolean` | `false` | Enables console.log tracing |
| `detached` | `boolean` | `false` | Detach process; kill uses `process.kill(-pid, 'SIGKILL')` |

---

## Methods

### `launch(): Promise<number | null>`

- Spawns browser with `child_process.spawn`
- Auto-assigns `port` via OS if `options.port` was `null`
- Waits up to `launchTimeout` ms for TCP connection on `127.0.0.1:{port}`
- Registers `SIGINT`/`SIGTERM`/`exit` handlers that auto-call `kill()`
- Returns: PID (`number`) on success
- Returns: `null` — already launching, port already in use, or timeout exceeded
- Throws: `Error` — `browserPath` does not exist on disk

### `kill(): void`

- Sends `SIGKILL` to the process (`SIGKILL` on process group when `detached: true`)
- Removes all registered signal handlers
- Sets `this.process = null`
- Safe to call multiple times

### `waitUntilReady(): Promise<boolean>`

- Polls `isDebuggerReady()` every 250 ms
- Returns `true` when port accepts connections
- Returns `false` on timeout or if process is killed while waiting

### `isDebuggerReady(): Promise<boolean>`

- TCP connect attempt to `127.0.0.1:{this.port}`, 2000 ms internal timeout
- Returns `true` on connect, `false` on error/timeout
- Never throws

### `getFlags(): string[]`

- Returns final CLI args array
- Injects `--remote-debugging-port={port}` and `--user-data-dir={profileDir}` unless already in `this.flags`
- Appends `this.url` as last element if truthy

### `delay(ms: number): Promise<void>`

- Resolves after `ms` milliseconds

### `log(...args): void`

- Writes to `console.log` only when `this.debug === true`

---

## Instance Properties

| Property | Type | Description |
|----------|------|-------------|
| `process` | `ChildProcess \| null` | Live child process; `null` before launch or after kill |
| `port` | `number \| null` | Actual port in use after launch |

---

## Usage Patterns

### Basic headless launch

```js
import Launcher from '../src/index.js'

const browser = new Launcher({
    browserPath: '/usr/bin/chromium',
    flags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
    url: 'https://example.com',
})

const pid = await browser.launch()
// pid is a number if successful, null otherwise

// connect CDP client to: http://127.0.0.1:{browser.port}

browser.kill()
```

### Fixed port with debug logging

```js
const browser = new Launcher({ port: 9222, debug: true })
const pid = await browser.launch()
if (pid === null) {
    console.error('Failed to launch or already running')
}
```

### Checking if browser is already up

```js
const browser = new Launcher({ port: 9222 })
const ready = await browser.isDebuggerReady()
if (!ready) {
    await browser.launch()
}
```

---

## Constraints / Gotchas

- The export is default-only — `import { Launcher }` does not work; use `import Launcher from ...`
- `launch()` returns `null` (not throws) when an existing process is already listening on `port` — this is not an error condition
- If `launch()` is called while a previous launch is still pending, it immediately returns `null`
- Signal handlers (`SIGINT`, `SIGTERM`, `exit`) are registered on the Node.js process itself; each `launch()` call replaces the previous handlers to avoid leaks
- `kill()` does not wait for the process to actually exit — `this.process` is set to `null` immediately
- When `detached: true`, `kill()` uses `process.kill(-pid, 'SIGKILL')` which kills all child processes of the browser group; use with caution
- `--remote-debugging-port` and `--user-data-dir` are auto-injected; if you pass them in `flags`, they take effect and the auto-injection is skipped for those keys
- `getFlags()` will use `this.port` which may be `null` before `launch()` is called if no port was configured
- `launchTimeout` controls only the wait for TCP readiness, not the overall process startup time
- `isDebuggerReady()` uses a 2-second hardcoded socket timeout independent of `launchTimeout`

---

## Knowledge Base

**KB tags for this library:** `imagic-browser-launcher, testing`

Before COMPLEX tasks — invoke `knowledge-reader` with tags above + task-specific tags.
After completing a task — if a reusable pattern, error, or decision emerged, invoke `knowledge-writer` with `source: imagic-browser-launcher`.

See `CLAUDE.md` §Knowledge Base Protocol for the full workflow.
