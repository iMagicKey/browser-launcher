# imagic-browser-launcher

> Launch and manage a Chromium-based browser process with remote debugging enabled.

## Install

```bash
npm install imagic-browser-launcher
```

## Quick Start

```js
import Launcher from 'imagic-browser-launcher'

const browser = new Launcher({
    browserPath: '/usr/bin/chromium',
    url: 'https://example.com',
    debug: true,
})

const pid = await browser.launch()
console.log('Browser PID:', pid)

// Terminate when done
browser.kill()
```

## API

### `new Launcher(options?)`

Creates a new launcher instance. The browser process is not started until `.launch()` is called.

```ts
new Launcher(options?: {
    browserPath?: string    // default: '/usr/bin/chromium'
    port?: number | null    // default: null  (random free port assigned at launch)
    profileDir?: string     // default: '/tmp/chromium-profile'
    url?: string            // default: 'about:blank'
    flags?: string[]        // default: []
    launchTimeout?: number  // milliseconds; default: 10000
    debug?: boolean         // default: false
    detached?: boolean      // default: false
})
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `browserPath` | `string` | `'/usr/bin/chromium'` | Absolute path to the browser executable |
| `port` | `number \| null` | `null` | Remote debugging port. When `null`, a random free OS port is assigned at launch time |
| `profileDir` | `string` | `'/tmp/chromium-profile'` | Path to the browser user data directory (`--user-data-dir`) |
| `url` | `string` | `'about:blank'` | URL opened when the browser starts; appended as the last CLI argument |
| `flags` | `string[]` | `[]` | Extra CLI flags. `--remote-debugging-port` and `--user-data-dir` are injected automatically unless already present in this array |
| `launchTimeout` | `number` | `10000` | Milliseconds to wait for the remote debugging port to become reachable before giving up |
| `debug` | `boolean` | `false` | Print internal status messages to `console.log` |
| `detached` | `boolean` | `false` | Spawn the process detached from the parent. On kill, the entire process group is terminated (`SIGKILL` on `-pid`) |

---

### `launcher.launch(): Promise<number | null>`

Spawns the browser and waits for its remote debugging port to accept TCP connections.

**Returns** the process PID (`number`) on success, or `null` when:
- A launch is already in progress
- An existing browser is already listening on the configured port
- The debugging port did not become ready within `launchTimeout`

Automatically registers `SIGINT`, `SIGTERM`, and `exit` handlers on the Node.js process to call `kill()` on exit. Any previously registered handlers from a prior launch are removed before new ones are added.

**Throws** `Error` if the browser executable is not found at `browserPath`.

---

### `launcher.kill(): void`

Sends `SIGKILL` to the browser process and removes all registered signal handlers.

Safe to call multiple times — no-op if the process is already gone or was never started. Sets `this.process` to `null` after killing.

When `detached: true`, kills the entire process group via `process.kill(-pid, 'SIGKILL')`.

---

### `launcher.waitUntilReady(): Promise<boolean>`

Polls `isDebuggerReady()` every 250 ms until the port opens or `launchTimeout` elapses.

Returns `false` immediately if the spawned process is killed while polling.

---

### `launcher.isDebuggerReady(): Promise<boolean>`

Attempts a TCP connection to `127.0.0.1:{port}` with a 2-second internal timeout.

Returns `true` on a successful connection, `false` on any error or timeout. Never throws.

---

### `launcher.getFlags(): string[]`

Returns the full list of CLI arguments that will be (or were) passed to the browser.

Always includes `--remote-debugging-port={port}` and `--user-data-dir={profileDir}` unless those keys are already present in `options.flags`. The `url` is appended last.

---

### `launcher.delay(ms): Promise<void>`

Resolves after `ms` milliseconds. Used internally between polling attempts.

---

### `launcher.log(...args): void`

Writes to `console.log` when `debug: true`. No-op otherwise.

---

### Instance properties

| Property | Type | Description |
|----------|------|-------------|
| `process` | `ChildProcess \| null` | The spawned child process; `null` before launch or after kill |
| `port` | `number \| null` | Debugging port in use; populated at launch time if not specified in options |

## Error Handling

`launch()` throws a plain `Error` when the executable is missing:

```
Error: [Launcher] Browser not found at: /usr/bin/chromium
```

All other failure modes (timeout, process exiting early) cause `launch()` to return `null`. In every failure case `kill()` is called internally to clean up state and signal handlers.

`isDebuggerReady()` never throws — all network errors are caught and resolved as `false`.

## Examples

See [`examples/index.js`](examples/index.js) for a complete headless Chromium setup.

```js
import Launcher from '../src/index.js'

const browser = new Launcher({
    browserPath: '/path/to/chrome',
    port: 9223,
    url: 'https://example.com',
    flags: [
        '--headless=new',
        '--no-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
    ],
    debug: true,
})

browser
    .launch()
    .then((pid) => console.log('Browser PID:', pid))
    .catch((err) => console.error('Launch failed:', err))
```

## License

MIT
