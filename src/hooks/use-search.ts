'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { trackSearchUsed } from '@/lib/analytics'

export interface SearchResult {
  id: number
  media_type: 'movie' | 'tv'
  title: string
  poster_path: string | null
  year: string
}

export const POPULAR_QUERIES = [
  'Паразиты',
  'Интерстеллар',
  'Игра в кальмара',
  'Побег из Шоушенка',
  'Зелёная книга',
  'Довод',
]

export function useSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([])
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = (await res.json()) as { results: SearchResult[] }
      setResults(data.results)
      trackSearchUsed(q.length, data.results.length)
    } catch {
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (/^#\d+$/.test(value.trim())) {
      setResults([])
      return
    }
    debounceRef.current = setTimeout(() => void search(value), 300)
  }, [search])

  const selectQuery = useCallback((value: string) => {
    setQuery(value)
    void search(value)
  }, [search])

  const reset = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setQuery('')
    setResults([])
  }, [])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return { query, results, isLoading, handleQueryChange, selectQuery, reset }
}
