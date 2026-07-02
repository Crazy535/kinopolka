import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Search } from 'lucide-react'
import { DetectiveContainer } from '@/components/detective/detective-container'

export const metadata: Metadata = {
  title: 'Кино-детектив — Кинополка',
  description: 'Опиши фильм который не можешь вспомнить — мы его найдём.',
}

export default function DetectivePage() {
  return (
    <div className="pb-12">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        На главную
      </Link>

      <div className="mb-8">
        <h1 className="flex items-center gap-2.5 font-heading text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
          <Search className="size-7 text-primary sm:size-8" strokeWidth={2} /> Кино-детектив
        </h1>
        <p className="mt-2 text-muted-foreground">
          Опиши фильм который не можешь вспомнить — мы его найдём
        </p>
      </div>

      <DetectiveContainer />
    </div>
  )
}
