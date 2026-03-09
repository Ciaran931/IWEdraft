'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const LANGUAGE_OPTIONS = [
  { code: 'pl', label: 'Polish' },
  { code: 'fr', label: 'French' },
  { code: 'es', label: 'Spanish' },
  { code: 'de', label: 'German' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'it', label: 'Italian' },
  { code: 'tr', label: 'Turkish' },
  { code: 'ar', label: 'Arabic' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'vi', label: 'Vietnamese' },
]

export default function SignupPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [languageCode, setLanguageCode] = useState('pl')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { language_code: languageCode },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <h1 className="font-serif text-3xl text-ink mb-4">Input With Ease</h1>
          <div className="bg-surface border border-border rounded-lg p-8 shadow-sm">
            <h2 className="font-serif text-xl mb-3">Check your email</h2>
            <p className="text-muted text-sm mb-6">
              We sent a confirmation link to <strong className="text-ink">{email}</strong>.
              Click the link in that email to activate your account, then come back and sign in.
            </p>
            <Link href="/login" className="inline-block px-4 py-2 bg-terracotta text-white text-sm rounded hover:bg-terracotta-light transition-colors">
              Go to sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl text-ink mb-1">Input With Ease</h1>
          <p className="text-muted text-sm">Create your account to start learning</p>
        </div>

        <div className="bg-surface border border-border rounded-lg p-8 shadow-sm">
          <h2 className="font-serif text-xl mb-6">Create account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full border border-border rounded px-3 py-2 text-sm bg-paper focus:outline-none focus:border-terracotta transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full border border-border rounded px-3 py-2 text-sm bg-paper focus:outline-none focus:border-terracotta transition-colors"
                placeholder="Min. 6 characters"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Your native language
              </label>
              <select
                value={languageCode}
                onChange={e => setLanguageCode(e.target.value)}
                className="w-full border border-border rounded px-3 py-2 text-sm bg-paper focus:outline-none focus:border-terracotta transition-colors"
              >
                {LANGUAGE_OPTIONS.map(opt => (
                  <option key={opt.code} value={opt.code}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted mt-1">
                Used to show translations while reading
              </p>
            </div>

            {error && (
              <p className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-terracotta text-white rounded py-2 text-sm font-medium hover:bg-terracotta-light transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-muted mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-terracotta hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
