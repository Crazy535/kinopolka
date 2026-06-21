/**
 * Plugins registry — статичный каталог first-party модулей.
 *
 * ЖЁСТКОЕ ПРАВИЛО: плагины вшиты в код. Никакой загрузки или исполнения
 * стороннего кода из интернета (это пиратский вектор LAMPA + RCE/supply-chain).
 * Плагин МОЖЕТ ходить в сеть за ДАННЫМИ (IPTV тянет M3U по URL и т.п.),
 * но сам себя из интернета НЕ подгружает. Аналогия: App Store, а не «.exe с форума».
 */

export type PluginCategory = 'media' | 'import' | 'utility'

export type PluginStatus = 'stable' | 'beta' | 'soon'

/** Имя иконки из lucide-react (резолвится в компоненте). */
export type PluginIcon = 'Tv' | 'Download' | 'CalendarClock'

export interface Plugin {
  /** Стабильный идентификатор, хранится в UserPlugin.pluginId. Не менять после релиза. */
  id: string
  name: string
  description: string
  icon: PluginIcon
  category: PluginCategory
  /** Путь к UI плагина внутри /profile/plugins. null для заглушек. */
  route: string | null
  status: PluginStatus
}

export const PLUGINS: readonly Plugin[] = [
  {
    id: 'iptv',
    name: 'IPTV-плеер',
    description: 'Свои M3U-плейлисты прямо в приложении. Только ваши плейлисты, без агрегации чужих стримов.',
    icon: 'Tv',
    category: 'media',
    route: '/profile/plugins/iptv',
    status: 'stable',
  },
  {
    id: 'letterboxd-import',
    name: 'Импорт из Letterboxd',
    description: 'Перенесите оценки и списки из Letterboxd в свой профиль Кинополки.',
    icon: 'Download',
    category: 'import',
    route: null,
    status: 'soon',
  },
  {
    id: 'release-calendar',
    name: 'Календарь премьер',
    description: 'Даты выхода ожидаемых фильмов и сериалов из вашего вотчлиста.',
    icon: 'CalendarClock',
    category: 'utility',
    route: null,
    status: 'soon',
  },
] as const

export type PluginId = (typeof PLUGINS)[number]['id']

export const PLUGIN_IDS: readonly string[] = PLUGINS.map((p) => p.id)

export function getPlugin(id: string): Plugin | undefined {
  return PLUGINS.find((p) => p.id === id)
}

export function isValidPluginId(id: string): id is PluginId {
  return PLUGIN_IDS.includes(id)
}
