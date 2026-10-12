import http from 'node:http'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

export function createRuntimeProxyServer({ targetHost = '127.0.0.1', targetPort }) {
return http.createServer((request, response) => {
  const upstream = http.request({
    hostname: targetHost,
    port: targetPort,
    path: request.url,
    method: request.method,
    headers: { ...request.headers, host: `${targetHost}:${targetPort}` },
  }, (upstreamResponse) => {
    response.writeHead(upstreamResponse.statusCode || 502, upstreamResponse.headers)
    upstreamResponse.pipe(response)
  })

  const cancelled = () => { if (!response.writableEnded) upstream.destroy() }
  response.once('close', cancelled); request.once('aborted', cancelled)
  upstream.on('error', () => {
    if (response.destroyed) return
    if (!response.headersSent) response.writeHead(502, { 'content-type': 'application/json' })
    response.end(JSON.stringify({ error: 'Application service is starting' }))
  })
  request.pipe(upstream)
})
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
const targetHost = process.env.TARGET_HOST || '127.0.0.1'
const targetPort = Number(process.env.TARGET_PORT)
const proxyHost = process.env.PROXY_HOST || '127.0.0.1'
const proxyPort = Number(process.env.PROXY_PORT)
if (!Number.isInteger(targetPort) || !Number.isInteger(proxyPort)) throw new Error('TARGET_PORT and PROXY_PORT must be numeric')
const server = createRuntimeProxyServer({ targetHost, targetPort })

server.listen(proxyPort, proxyHost, () => {
  console.log(`Runtime API gateway listening on http://${proxyHost}:${proxyPort}`)
})

function stop() {
  server.close(() => process.exit(0))
}

process.on('SIGINT', stop)
process.on('SIGTERM', stop)
}
