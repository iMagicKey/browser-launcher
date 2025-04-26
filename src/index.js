import { spawn } from 'child_process'
import fs from 'fs'
import * as net from 'net'

export default class Launcher {
    constructor(options = {}) {
        this.browserPath = options.browserPath || '/usr/bin/chromium'
        this.port = options.port || 9222
        this.profileDir = options.profileDir || '/tmp/chromium-profile'
        this.process = null
        this.url = options.url || 'about:blank'
        this.flags = options.flags || []
        this.launchTimeout = options.launchTimeout || 10000
        this.debug = options.debug || false
        this.detached = options.detached || false

        this._debuggerReady = false
    }

    getFlags() {
        const finalFlags = new Set()

        const userFlags = this.flags || []

        const flagKeys = userFlags
            .map((flag) => {
                const match = flag.match(/^--([^=]+)/)
                return match ? match[1] : null
            })
            .filter(Boolean)

        const hasFlag = (name) => flagKeys.includes(name)

        if (!hasFlag('remote-debugging-port')) {
            finalFlags.add(`--remote-debugging-port=${this.port}`)
        }

        if (!hasFlag('user-data-dir')) {
            finalFlags.add(`--user-data-dir=${this.profileDir}`)
        }

        for (const flag of userFlags) {
            finalFlags.add(flag)
        }

        if (this.url && !this.url.startsWith('--')) {
            finalFlags.add(this.url)
        }

        return Array.from(finalFlags)
    }

    log(...args) {
        if (this.debug) {
            console.log(...args)
        }
    }

    async launch() {
        if (!fs.existsSync(this.browserPath)) {
            throw new Error(`[Launcher] Browser not found at: ${this.browserPath}`)
        }

        if (await this.isDebuggerReady()) {
            this.log(`[Launcher] Found existing process already running using port ${this.port}.`)

            return null
        }

        this.process = spawn(this.browserPath, this.getFlags(), {
            detached: this.detached,
            stdio: 'ignore',
        })

        this.process.once('exit', (code, signal) => {
            if (!this._debuggerReady) {
                this.log(`[Launcher] Process exited early with code=${code}, signal=${signal}`)
                return null
            }
        })

        const browserEvents = ['close', 'exit', 'disconnect', 'disconnected', 'kill']
        for (const event of browserEvents) {
            this.process.on?.(event, () => {
                this.log(`[Launcher] Process event: ${event}`)
                this.kill()
            })
        }

        if (await this.waitUntilReady()) {
            this.log(`[Launcher] Browser is running on port ${this.port}`)

            return this.process.pid
        } else {
            this.log('[Launcher] Failed to connect to browser debugger')
            this.kill()
        }

        return null
    }

    async waitUntilReady() {
        const start = Date.now()
        while (Date.now() - start < this.launchTimeout) {
            if (await this.isDebuggerReady()) {
                return true
            } else {
                await this.delay(500)
            }
        }

        return false
    }

    isDebuggerReady() {
        return new Promise((resolve) => {
            const client = net.createConnection(this.port, '127.0.0.1')
            const cleanup = () => {
                try {
                    client.removeAllListeners()
                    client.end()
                    client.destroy()
                } catch (e) {
                    //
                }
            }

            client.once('error', () => {
                cleanup()
                resolve(false)
            })

            client.once('connect', () => {
                cleanup()
                resolve(true)
            })
        })
    }

    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms))
    }

    kill() {
        if (this.process && !this.process.killed) {
            this.process.kill('SIGKILL')
            this.log('[Launcher] Browser process killed.')
        }
        this.process = null
    }
}
