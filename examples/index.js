import { resolve } from 'path'
import Launcher from '../src/index.js'

const browserPath = `${resolve()}/browser/chrome`

const browser = new Launcher({
    browserPath,
    port: 9223,
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

process.on('exit', () => {
    if (browser.process) {
        browser.kill()
    }
})

browser
    .launch()
    .then((pid) => {
        console.log('Browser launched (pid):', pid)
    })
    .catch((error) => {
        console.error('Failed to launch browser:', error)
    })
