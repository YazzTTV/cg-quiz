import { redirect } from 'next/navigation'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { Nav } from '@/components/Nav'

export default async function Home() {
  const session = await auth()

  if (session) {
    redirect('/review')
  }

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-4">CG Quiz + Révisions espacées</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Application de quiz avec système de révisions espacées type Anki pour la culture générale.
        </p>
        <div className="space-y-4">
          <a
            href="/register"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Créer un compte
          </a>
          <a
            href="/login"
            className="inline-block px-6 py-3 ml-4 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Se connecter
          </a>
        </div>
      </main>
    </div>
  )
}
