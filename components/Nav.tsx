'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'

export function Nav() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()

  const handleReviewClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Si on est déjà sur /review, forcer la réinitialisation
    if (pathname === '/review') {
      e.preventDefault()
      // Déclencher un événement personnalisé pour réinitialiser l'état
      window.dispatchEvent(new CustomEvent('resetReviewPage'))
      // Forcer un re-render en naviguant vers la même route
      router.push('/review')
    }
  }

  const linkBase =
    'rounded-md px-3 py-2 text-sm font-semibold transition-colors'
  const linkIdle =
    'text-slate-100/80 hover:text-amber-100 hover:bg-white/5'
  const linkActive =
    'bg-amber-200/20 text-amber-100 ring-1 ring-amber-200/40'

  return (
    <nav className="border-b border-amber-200/30 bg-gradient-to-r from-slate-950/95 via-slate-900/95 to-blue-950/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-xl font-bold text-amber-100">
              CG Quiz+
            </Link>
            {session && (
              <>
                <Link 
                  href="/review" 
                  onClick={handleReviewClick}
                  className={`${linkBase} ${pathname === '/review' ? linkActive : linkIdle}`}
                >
                  Réviser
                </Link>
                <Link href="/fiches" className={`${linkBase} ${pathname === '/fiches' ? linkActive : linkIdle}`}>
                  Fiches
                </Link>
                <Link href="/dashboard" className={`${linkBase} ${pathname === '/dashboard' ? linkActive : linkIdle}`}>
                  Dashboard
                </Link>
                <Link href="/create" className={`${linkBase} ${pathname === '/create' ? linkActive : linkIdle}`}>
                  Créer
                </Link>
                <Link href="/admin" className={`${linkBase} ${pathname === '/admin' ? linkActive : linkIdle}`}>
                  Admin
                </Link>
              </>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {session ? (
              <>
                <span className="text-sm text-slate-100/75">{session.user.email}</span>
                <button
                  onClick={() => signOut()}
                  className="rounded-md border border-red-300/30 bg-red-600/90 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className={`${linkBase} ${pathname === '/login' ? linkActive : linkIdle}`}>
                  Connexion
                </Link>
                <Link href="/register" className="rounded-md border border-amber-200/40 bg-gradient-to-r from-amber-200 via-amber-100 to-yellow-200 px-4 py-2 text-sm font-semibold text-slate-900 hover:brightness-105">
                  Inscription
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

