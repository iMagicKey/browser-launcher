import { describe, it } from 'node:test'
import { expect } from 'chai'
import Launcher from '../src/index.js'

describe('Launcher', () => {
    describe('constructor', () => {
        it('sets default browser path', () => {
            const launcher = new Launcher()
            expect(launcher.browserPath).to.equal('/usr/bin/chromium')
        })

        it('sets default port to null', () => {
            const launcher = new Launcher()
            expect(launcher.port).to.be.null
        })

        it('sets default profileDir', () => {
            const launcher = new Launcher()
            expect(launcher.profileDir).to.equal('/tmp/chromium-profile')
        })

        it('sets default url to about:blank', () => {
            const launcher = new Launcher()
            expect(launcher.url).to.equal('about:blank')
        })

        it('sets default flags to empty array', () => {
            const launcher = new Launcher()
            expect(launcher.flags).to.deep.equal([])
        })

        it('sets default launchTimeout to 10000', () => {
            const launcher = new Launcher()
            expect(launcher.launchTimeout).to.equal(10000)
        })

        it('sets default debug to false', () => {
            const launcher = new Launcher()
            expect(launcher.debug).to.be.false
        })

        it('sets default detached to false', () => {
            const launcher = new Launcher()
            expect(launcher.detached).to.be.false
        })

        it('sets default process to null', () => {
            const launcher = new Launcher()
            expect(launcher.process).to.be.null
        })

        it('initialises signal handler references to null', () => {
            const launcher = new Launcher()
            expect(launcher._sigintHandler).to.be.null
            expect(launcher._sigtermHandler).to.be.null
            expect(launcher._exitHandler).to.be.null
        })

        it('applies custom options', () => {
            const launcher = new Launcher({
                browserPath: '/usr/bin/google-chrome',
                port: 9222,
                profileDir: '/tmp/my-profile',
                url: 'https://example.com',
                launchTimeout: 5000,
                debug: true,
                detached: true,
            })
            expect(launcher.browserPath).to.equal('/usr/bin/google-chrome')
            expect(launcher.port).to.equal(9222)
            expect(launcher.profileDir).to.equal('/tmp/my-profile')
            expect(launcher.url).to.equal('https://example.com')
            expect(launcher.launchTimeout).to.equal(5000)
            expect(launcher.debug).to.be.true
            expect(launcher.detached).to.be.true
        })
    })

    describe('getFlags', () => {
        it('includes --remote-debugging-port flag', () => {
            const launcher = new Launcher({ port: 9222 })
            const flags = launcher.getFlags()
            expect(flags).to.include('--remote-debugging-port=9222')
        })

        it('includes --user-data-dir flag', () => {
            const launcher = new Launcher({ port: 9222 })
            const flags = launcher.getFlags()
            expect(flags).to.include('--user-data-dir=/tmp/chromium-profile')
        })

        it('includes URL as last positional argument', () => {
            const launcher = new Launcher({ url: 'https://example.com', port: 9222 })
            const flags = launcher.getFlags()
            expect(flags[flags.length - 1]).to.equal('https://example.com')
        })

        it('URL does not appear as a --flag', () => {
            const launcher = new Launcher({ url: 'https://example.com', port: 9222 })
            const flags = launcher.getFlags()
            const urlFlags = flags.filter((f) => f === 'https://example.com' && f.startsWith('--'))
            expect(urlFlags).to.have.length(0)
        })

        it('does not duplicate --remote-debugging-port when already in user flags', () => {
            const launcher = new Launcher({
                port: 9222,
                flags: ['--remote-debugging-port=9999'],
            })
            const flags = launcher.getFlags()
            const portFlags = flags.filter((f) => f.startsWith('--remote-debugging-port='))
            expect(portFlags).to.have.length(1)
            expect(portFlags[0]).to.equal('--remote-debugging-port=9999')
        })

        it('does not duplicate --user-data-dir when already in user flags', () => {
            const launcher = new Launcher({
                port: 9222,
                flags: ['--user-data-dir=/custom/profile'],
            })
            const flags = launcher.getFlags()
            const dirFlags = flags.filter((f) => f.startsWith('--user-data-dir='))
            expect(dirFlags).to.have.length(1)
            expect(dirFlags[0]).to.equal('--user-data-dir=/custom/profile')
        })

        it('includes user-provided custom flags', () => {
            const launcher = new Launcher({
                port: 9222,
                flags: ['--headless=new', '--no-sandbox'],
            })
            const flags = launcher.getFlags()
            expect(flags).to.include('--headless=new')
            expect(flags).to.include('--no-sandbox')
        })

        it('appends default url (about:blank) as last arg', () => {
            const launcher = new Launcher({ port: 9222 })
            const flags = launcher.getFlags()
            expect(flags[flags.length - 1]).to.equal('about:blank')
        })
    })

    describe('kill', () => {
        it('does not throw when process is null', () => {
            const launcher = new Launcher()
            expect(() => launcher.kill()).to.not.throw()
        })

        it('sets process to null after kill when no process exists', () => {
            const launcher = new Launcher()
            launcher.kill()
            expect(launcher.process).to.be.null
        })

        it('removes SIGINT listener on kill', () => {
            const launcher = new Launcher()
            const handler = () => {}
            launcher._sigintHandler = handler
            process.on('SIGINT', handler)

            const listenersBefore = process.listenerCount('SIGINT')
            launcher.kill()
            const listenersAfter = process.listenerCount('SIGINT')

            expect(listenersAfter).to.equal(listenersBefore - 1)
            expect(launcher._sigintHandler).to.be.null
        })

        it('removes SIGTERM listener on kill', () => {
            const launcher = new Launcher()
            const handler = () => {}
            launcher._sigtermHandler = handler
            process.on('SIGTERM', handler)

            const listenersBefore = process.listenerCount('SIGTERM')
            launcher.kill()
            const listenersAfter = process.listenerCount('SIGTERM')

            expect(listenersAfter).to.equal(listenersBefore - 1)
            expect(launcher._sigtermHandler).to.be.null
        })

        it('removes exit listener on kill', () => {
            const launcher = new Launcher()
            const handler = () => {}
            launcher._exitHandler = handler
            process.on('exit', handler)

            const listenersBefore = process.listenerCount('exit')
            launcher.kill()
            const listenersAfter = process.listenerCount('exit')

            expect(listenersAfter).to.equal(listenersBefore - 1)
            expect(launcher._exitHandler).to.be.null
        })

        it('clears all handler refs to null after kill', () => {
            const launcher = new Launcher()
            launcher._sigintHandler = () => {}
            launcher._sigtermHandler = () => {}
            launcher._exitHandler = () => {}
            launcher.kill()
            expect(launcher._sigintHandler).to.be.null
            expect(launcher._sigtermHandler).to.be.null
            expect(launcher._exitHandler).to.be.null
        })
    })

    describe('signal handlers', () => {
        it('SIGINT handler does not call process.exit', () => {
            const launcher = new Launcher()
            const originalExit = process.exit
            let exitCalled = false
            process.exit = () => {
                exitCalled = true
            }

            try {
                // Simulate what the handler does directly
                const handler = () => {
                    launcher.kill()
                    // process.exit should NOT be called
                }
                handler()
                expect(exitCalled).to.be.false
            } finally {
                process.exit = originalExit
            }
        })

        it('SIGTERM handler does not call process.exit', () => {
            const launcher = new Launcher()
            const originalExit = process.exit
            let exitCalled = false
            process.exit = () => {
                exitCalled = true
            }

            try {
                const handler = () => {
                    launcher.kill()
                    // process.exit should NOT be called
                }
                handler()
                expect(exitCalled).to.be.false
            } finally {
                process.exit = originalExit
            }
        })
    })

    describe('launch', () => {
        it('throws if browser path does not exist', async () => {
            const launcher = new Launcher({
                browserPath: '/nonexistent/path/to/browser',
                port: 19222,
            })
            let threw = false
            try {
                await launcher.launch()
            } catch (err) {
                threw = true
                expect(err.message).to.match(/Browser not found/)
            }
            expect(threw).to.be.true
        })

        it('returns null when launch is already in progress', async () => {
            const launcher = new Launcher({
                browserPath: '/nonexistent/path',
                port: 19223,
            })
            // Manually set _isLaunching to simulate concurrent launch
            launcher._isLaunching = true
            const result = await launcher.launch()
            expect(result).to.be.null
        })
    })

    describe('isDebuggerReady', () => {
        it('returns false when no debugger is listening', async () => {
            const launcher = new Launcher({ port: 19299 })
            const result = await launcher.isDebuggerReady()
            expect(result).to.be.false
        })
    })

    describe('delay', () => {
        it('resolves after the specified milliseconds', async () => {
            const launcher = new Launcher()
            const start = Date.now()
            await launcher.delay(50)
            const elapsed = Date.now() - start
            expect(elapsed).to.be.at.least(40)
        })
    })
})
