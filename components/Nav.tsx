'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

export function Nav() {
  const { data: session } = useSession()

  return (
    <nav className="border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-xl font-bold">
              CG Quiz+
            </Link>
            {session && (
              <>
                <Link href="/review" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                  Réviser
                </Link>
                <Link href="/dashboard" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                  Dashboard
                </Link>
                <Link href="/create" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                  Créer
                </Link>
                <Link href="/admin" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                  Admin
                </Link>
              </>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {session ? (
              <>
                <span className="text-sm text-gray-600 dark:text-gray-400">{session.user.email}</span>
                <button
                  onClick={() => signOut()}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                  Connexion
                </Link>
                <Link href="/register" className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
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

