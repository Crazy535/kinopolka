import Image from 'next/image'
import { getProfileUrl } from '@/lib/tmdb-image'
import type { TMDBPersonDetails } from '@/types/tmdb'

const DEPT_MAP: Record<string, string> = {
  Acting: 'Актёр',
  Directing: 'Режиссёр',
  Writing: 'Сценарист',
  Production: 'Продюсер',
  Sound: 'Звукорежиссёр',
  Camera: 'Оператор',
  Crew: 'Съёмочная группа',
}

function calcAge(birthday: string | null, deathday: string | null): number | null {
  if (!birthday) return null
  const end = deathday ? new Date(deathday) : new Date()
  const born = new Date(birthday)
  const age = end.getFullYear() - born.getFullYear()
  const notYetBirthday =
    end.getMonth() < born.getMonth() ||
    (end.getMonth() === born.getMonth() && end.getDate() < born.getDate())
  return notYetBirthday ? age - 1 : age
}

function ageWord(age: number): string {
  const mod100 = age % 100
  const mod10 = age % 10
  if (mod100 >= 11 && mod100 <= 19) return 'лет'
  if (mod10 === 1) return 'год'
  if (mod10 >= 2 && mod10 <= 4) return 'года'
  return 'лет'
}

interface PersonHeroProps {
  person: TMDBPersonDetails
}

export function PersonHero({ person }: PersonHeroProps) {
  const profileUrl = getProfileUrl(person.profile_path, 'w185')
  const age = calcAge(person.birthday, person.deathday)
  const dept = DEPT_MAP[person.known_for_department] ?? person.known_for_department

  return (
    <div className="mb-8 flex gap-5 sm:gap-8">
      {profileUrl ? (
        <div className="relative size-24 shrink-0 overflow-hidden rounded-full ring-2 ring-border sm:size-32">
          <Image
            src={profileUrl}
            alt={person.name}
            fill
            sizes="128px"
            className="object-cover"
            priority
          />
        </div>
      ) : (
        <div className="flex size-24 shrink-0 items-center justify-center rounded-full bg-muted ring-2 ring-border sm:size-32">
          <span className="text-3xl text-muted-foreground">?</span>
        </div>
      )}

      <div className="flex flex-col justify-center gap-2">
        <h1 className="font-heading text-2xl font-bold leading-tight sm:text-3xl">{person.name}</h1>
        {dept && (
          <p className="text-sm font-medium text-primary">{dept}</p>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {age !== null && (
            <span>{age} {ageWord(age)}{person.deathday ? ' †' : ''}</span>
          )}
          {person.place_of_birth && <span>{person.place_of_birth}</span>}
        </div>
      </div>
    </div>
  )
}
