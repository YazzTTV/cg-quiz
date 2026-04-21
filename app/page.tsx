import { redirect } from 'next/navigation'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import LandingPage from '@/components/LandingPage'

export default async function Home() {
  const session = await auth()

  if (session) {
    redirect('/review')
  }

  return (
    <div className="min-h-screen">
      <LandingPage />
    </div>
  )
}
