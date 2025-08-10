import { createServer } from 'http'

export default async function getRandomPort() {
    return new Promise((resolve, reject) => {
        const server = createServer()
        server.listen(0)
        server.once('listening', () => {
            const { port } = server.address()
            server.close(() => resolve(port))
        })
        server.once('error', reject)
    })
}
