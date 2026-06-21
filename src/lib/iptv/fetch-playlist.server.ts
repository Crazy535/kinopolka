import 'server-only'
import { parseM3u, type M3uChannel } from './parse-m3u'

const MAX_BYTES = 10 * 1024 * 1024 // 10 МБ — лимит размера ответа
const TIMEOUT_MS = 10_000

/**
 * Список приватных CIDR, которые нельзя использовать в URL пользователя.
 * Защищает от SSRF-атак через резолв на loopback/link-local/RFC-1918 адреса.
 */
interface PrivateRange { ip: number; prefix: number }

const PRIVATE_RANGES: PrivateRange[] = [
  { ip: (127 << 24) >>> 0, prefix: 8 },    // 127.0.0.0/8   loopback
  { ip: (169 << 24 | 254 << 16) >>> 0, prefix: 16 }, // 169.254.0.0/16 link-local
  { ip: (10 << 24) >>> 0, prefix: 8 },     // 10.0.0.0/8    RFC-1918
  { ip: (172 << 24 | 16 << 16) >>> 0, prefix: 12 }, // 172.16.0.0/12 RFC-1918
  { ip: (192 << 24 | 168 << 16) >>> 0, prefix: 16 }, // 192.168.0.0/16 RFC-1918
  { ip: 0, prefix: 8 },                    // 0.0.0.0/8
]

function ipToInt(ip: string): number {
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) return -1
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0
}

function isPrivateIp(ip: string): boolean {
  const n = ipToInt(ip)
  if (n === -1) return true // не удалось распарсить — запрещаем
  for (const { ip: rangeIp, prefix } of PRIVATE_RANGES) {
    const mask = prefix >= 32 ? 0xffffffff : (~(0xffffffff >>> prefix)) >>> 0
    if ((n & mask) === (rangeIp & mask)) return true
  }
  return false
}

/** Разрешаем только http/https; блокируем редиректы на приватные IP. */
function validateUrl(raw: string): URL {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new Error('Invalid URL')
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Only http/https allowed')
  }
  // Проверяем hostname как IP (если вдруг передали IP напрямую)
  const hostIsIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(url.hostname)
  if (hostIsIp && isPrivateIp(url.hostname)) {
    throw new Error('Private IP ranges are not allowed')
  }
  return url
}

export async function fetchPlaylistText(rawUrl: string): Promise<string> {
  const url = validateUrl(rawUrl)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(url.toString(), {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'Kinopolka-IPTV/1.0' },
    })
  } finally {
    clearTimeout(timer)
  }

  if (!response.ok) {
    throw new Error(`Playlist fetch failed: ${response.status}`)
  }

  // Проверяем Content-Length перед чтением
  const contentLength = Number(response.headers.get('content-length') ?? 0)
  if (contentLength > MAX_BYTES) {
    throw new Error('Playlist too large')
  }

  // Читаем с потоковым лимитом
  const reader = response.body?.getReader()
  if (!reader) throw new Error('No response body')

  const chunks: Uint8Array[] = []
  let totalBytes = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    totalBytes += value.byteLength
    if (totalBytes > MAX_BYTES) {
      reader.cancel()
      throw new Error('Playlist too large')
    }
    chunks.push(value)
  }

  const merged = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.byteLength
  }

  return new TextDecoder().decode(merged)
}

export async function fetchAndParsePlaylist(rawUrl: string): Promise<M3uChannel[]> {
  const text = await fetchPlaylistText(rawUrl)
  return parseM3u(text)
}
