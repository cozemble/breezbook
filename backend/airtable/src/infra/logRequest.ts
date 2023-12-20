import { Request } from 'express'

function mask(header: string | undefined) {
  if (header) {
    return Array.from(header)
      .map((c, index) => (index < 4 ? c : '*'))
      .join('')
  }
  return null
}

export function logRequest(req: Request) {
  const contentType = req.header('Content-Type') ?? 'none'
  let authorizationHeader = req.header('Authorization') ?? 'none'
  if (!authorizationHeader.startsWith('Bearer ')) {
    authorizationHeader = mask(authorizationHeader) ?? 'none'
  }
  const lines = [
    'Content-Type',
    'Referer',
    'Content-Length',
    'X-Forwarded-For',
    'User-Agent',
  ].reduce(
    (acc, header) => {
      const value = req.header(header)
      if (value) {
        acc.push(`${header}: ${value}`)
      }
      return acc
    },
    [`${req.method} ${req.path}`, 'Authorization: ' + authorizationHeader],
  )
  if (contentType && contentType.toLowerCase() === 'application/json') {
    lines.push('Body:' + mask(JSON.stringify(req.body)))
  }
  console.log(lines.join('\n'))
  console.log('\n')
}
