import { resolve } from 'path'
import Launcher from '../src/index.js'

const browserPath = `${resolve()}/browser/chrome`

const browser = new Launcher({
    browserPath,
    port: 9223,
    url: 'https://example.com',
    flags: [
        '--headless=new',
        '--no-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-sync',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-first-run',
        '--no-default-browser-check',
        '--hide-scrollbars',
        '--disable-translate',
        '--disable-features=TranslateUI',
    ],
    debug: true,
})

// Signal handling is managed internally by the Launcher instance.
// kill() removes all registered signal listeners automatically.
// You can still add your own cleanup logic here if needed.
process.on('exit', () => {
    browser.kill()
})

browser
    .launch()
    .then((pid) => {
        console.log('Browser launched (pid):', pid)
    })
    .catch((error) => {
        console.error('Failed to launch browser:', error)
    })
