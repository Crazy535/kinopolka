import { NextRequest } from 'next/server'

const POSTHOG_HOST = 'https://eu.posthog.com'

async function proxy(req: NextRequest, path: string[]) {
  const targetUrl = `${POSTHOG_HOST}/${path.join('/')}${req.nextUrl.search}`

  const headers: HeadersInit = {}
  const contentType = req.headers.get('content-type')
  if (contentType) headers['content-type'] = contentType
  const userAgent = req.headers.get('user-agent')
  if (userAgent) headers['user-agent'] = userAgent

  const body =
    req.method !== 'GET' && req.method !== 'HEAD'
      ? await req.arrayBuffer()
      : undefined

  const res = await fetch(targetUrl, {
    method: req.method,
    headers,
    body,
  })

  const data = await res.arrayBuffer()
  const responseContentType = res.headers.get('content-type') ?? 'application/json'
  return new Response(data, {
    status: res.status,
    headers: {
      'content-type': responseContentType,
    },
  })
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params
  return proxy(req, path)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params
  return proxy(req, path)
}
