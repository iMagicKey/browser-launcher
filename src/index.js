/* eslint-disable no-await-in-loop */
/* eslint-disable no-underscore-dangle */
import { spawn } from 'child_process'
import fs from 'fs'
import * as net from 'net'
import getRandomPort from './modules/getRandomPort.js'

export default class Launcher {
    constructor(options = {}) {
        this.browserPath = options.browserPath || '/usr/bin/chromium'
        this.port = options.port || null
        this.profileDir = options.profileDir || '/tmp/chromium-profile'
        this.process = null
        this.url = options.url || 'about:blank'
        this.flags = options.flags || []
        this.launchTimeout = options.launchTimeout || 10000
        this.debug = options.debug || false
        this.detached = options.detached || false

        this._debuggerReady = false
        this._isLaunching = false
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
        if (this._isLaunching) {
            this.log('[Launcher] Launch already in progress')
            return null
        }

        this._isLaunching = true

        if (!this.port) {
            this.port = await getRandomPort()
        }

        try {
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

            const cleanupHandler = () => {
                this.kill()
                process.exit()
            }
            process.once('SIGINT', cleanupHandler)
            process.once('SIGTERM', cleanupHandler)
            process.once('exit', () => this.kill())

            this.process.once('exit', (code, signal) => {
                if (!this._debuggerReady) {
                    this.log(`[Launcher] Process exited early with code=${code}, signal=${signal}`)
                }
            })

            const browserEvents = ['close', 'exit', 'disconnect']
            browserEvents.forEach((event) => {
                this.process.on?.(event, () => {
                    this.log(`[Launcher] Process event: ${event}`)
                    this.kill()
                })
            })

            const isReady = await this.waitUntilReady()

            if (isReady) {
                this._debuggerReady = true
                this.log(`[Launcher] Browser ready on port ${this.port}`)
                return this.process.pid
            }

            this.log('[Launcher] Browser failed to become ready within timeout')
            await this.kill()
            return null
        } catch (error) {
            this.log(`[Launcher] Launch failed: ${error.message}`)
            await this.kill()
            throw error
        } finally {
            this._isLaunching = false
        }
    }

    async waitUntilReady() {
        const start = Date.now()
        while (Date.now() - start < this.launchTimeout) {
            if (this.process && this.process.killed) {
                this.log('[Launcher] Process was killed while waiting')
                return false
            }

            if (await this.isDebuggerReady()) {
                return true
            }
            await this.delay(250)
        }

        return false
    }

    isDebuggerReady() {
        return new Promise((resolve) => {
            const cleanup = () => {
                clearTimeout(timeout)
                try {
                    client.removeAllListeners()
                    if (!client.destroyed) {
                        client.end()
                        client.destroy()
                    }
                } catch (e) {
                    // Ignore cleanup errors
                }
            }
            const timeout = setTimeout(() => {
                cleanup()
                resolve(false)
            }, 2000)

            const client = net.createConnection(this.port, '127.0.0.1')

            client.once('error', (error) => {
                this.log(`[Launcher] Debugger connection error: ${error.message}`)
                cleanup()
                resolve(false)
            })

            client.once('connect', () => {
                this.log(`[Launcher] Debugger connection successful`)
                cleanup()
                resolve(true)
            })

            client.once('timeout', () => {
                this.log('[Launcher] Debugger connection timeout')
                cleanup()
                resolve(false)
            })
        })
    }

    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms))
    }

    kill() {
        if (this.process && !this.process.killed) {
            try {
                if (this.detached) {
                    process.kill(-this.process.pid, 'SIGKILL')
                } else {
                    this.process.kill('SIGKILL')
                }
                this.log('[Launcher] Browser process killed.')
            } catch (err) {
                this.log(`[Launcher] Kill error: ${err.message}`)
            }
        }
        this.process = null
    }
}
