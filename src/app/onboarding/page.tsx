import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getOnboardingPosters } from '@/lib/tmdb'
import { OnboardingContainer } from '@/components/onboarding/onboarding-container'

export const dynamic = 'force-dynamic'

export default async function OnboardingPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/')

  const existing = await prisma.tasteProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (existing) redirect('/')

  const posters = await getOnboardingPosters()

  return <OnboardingContainer posters={posters} />
}
