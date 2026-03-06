'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/app/(protected)/AuthProvider'
import {
  HomeIcon,
  BookOpenIcon,
  RectangleStackIcon,
  AcademicCapIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', Icon: HomeIcon },
  { href: '/input', label: 'Input', Icon: BookOpenIcon },
  { href: '/vocab', label: 'Vocab', Icon: RectangleStackIcon },
  { href: '/grammar', label: 'Grammar', Icon: AcademicCapIcon },
]

export default function Navbar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <>
      {/* Desktop top navbar */}
      <nav className="hidden md:flex items-center justify-between px-6 py-0 bg-paper border-b border-border">
        <span className="font-serif font-bold text-lg text-ink py-3">Input With Ease</span>

        <div className="flex items-center">
          {NAV_ITEMS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`relative px-5 py-3 text-sm font-medium transition-colors border-b-2 ${
                isActive(href)
                  ? 'border-terracotta text-terracotta'
                  : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              {label}
            </Link>
          ))}
          {user ? (
            <>
              <Link
                href="/settings"
                className={`relative px-5 py-3 text-sm font-medium transition-colors border-b-2 ml-4 ${
                  isActive('/settings')
                    ? 'border-terracotta text-terracotta'
                    : 'border-transparent text-muted hover:text-ink'
                }`}
              >
                Settings
              </Link>
              <button
                onClick={signOut}
                className="ml-2 p-2 text-muted hover:text-ink transition-colors"
                title="Sign out"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="ml-4 px-4 py-1.5 text-sm font-medium bg-terracotta text-white rounded hover:bg-terracotta-light transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-paper border-t border-border flex">
        {NAV_ITEMS.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs transition-colors ${
              isActive(href) ? 'text-terracotta' : 'text-muted'
            }`}
          >
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        ))}
        {user ? (
          <Link
            href="/settings"
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs transition-colors ${
              isActive('/settings') ? 'text-terracotta' : 'text-muted'
            }`}
          >
            <Cog6ToothIcon className="w-5 h-5" />
            Settings
          </Link>
        ) : (
          <Link
            href="/login"
            className="flex-1 flex flex-col items-center py-2 gap-0.5 text-xs text-terracotta"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            Sign in
          </Link>
        )}
      </nav>

      {/* Mobile bottom padding spacer */}
      <div className="md:hidden h-16" />
    </>
  )
}
