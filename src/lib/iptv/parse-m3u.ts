export interface M3uChannel {
  name: string
  logo: string | null
  group: string | null
  url: string
}

/**
 * Парсит содержимое M3U/M3U8-плейлиста.
 * Возвращает только каналы с явным http/https URL — без data:, rtmp: и т.д.
 */
export function parseM3u(content: string): M3uChannel[] {
  const lines = content.split(/\r?\n/)
  const channels: M3uChannel[] = []
  let pending: Partial<M3uChannel> | null = null

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    if (line.startsWith('#EXTINF')) {
      const nameMatch = /,(.+)$/.exec(line)
      const logoMatch = /tvg-logo="([^"]*)"/.exec(line)
      const groupMatch = /group-title="([^"]*)"/.exec(line)
      pending = {
        name: nameMatch?.[1]?.trim() ?? 'Канал',
        logo: logoMatch?.[1]?.trim() || null,
        group: groupMatch?.[1]?.trim() || null,
      }
      continue
    }

    if (pending && !line.startsWith('#')) {
      // Принимаем только безопасные схемы
      if (/^https?:\/\//i.test(line)) {
        channels.push({
          name: pending.name ?? 'Канал',
          logo: pending.logo ?? null,
          group: pending.group ?? null,
          url: line,
        })
      }
      pending = null
    }
  }

  return channels
}
