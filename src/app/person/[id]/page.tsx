import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getPersonDetails, getPersonCombinedCredits } from '@/lib/tmdb'
import { PersonHero } from '@/components/person/person-hero'
import { PersonBio } from '@/components/person/person-bio'
import { PersonFilmography } from '@/components/person/person-filmography'

export const revalidate = 86400

interface PersonPageProps {
  params: Promise<{ id: string }>
}

export default async function PersonPage({ params }: PersonPageProps) {
  const { id } = await params
  const personId = Number(id)
  if (!personId || isNaN(personId)) notFound()

  let person, credits
  try {
    ;[person, credits] = await Promise.all([
      getPersonDetails(personId),
      getPersonCombinedCredits(personId),
    ])
  } catch {
    notFound()
  }

  const topCredits = [...credits.cast]
    .filter((c) => c.vote_count >= 50 && c.poster_path)
    .sort(
      (a, b) =>
        b.vote_average * Math.log(b.vote_count + 1) -
        a.vote_average * Math.log(a.vote_count + 1)
    )
    .slice(0, 12)

  return (
    <div className="pb-12">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        На главную
      </Link>

      <PersonHero person={person} />

      {person.biography && <PersonBio biography={person.biography} />}

      {topCredits.length > 0 && <PersonFilmography credits={topCredits} />}
    </div>
  )
}
