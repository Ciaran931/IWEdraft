'use client'

import { useState } from 'react'
import { useAuth } from '@/app/(protected)/AuthProvider'
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

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const supabase = createClient()

  const [languageCode, setLanguageCode] = useState(user?.language_code ?? 'pl')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const { error } = await supabase
      .from('users')
      .update({ language_code: languageCode })
      .eq('id', user.id)

    setSaving(false)
    if (error) {
      setError('Could not save settings. Please try again.')
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto w-full">
      <h1 className="font-serif text-2xl mb-8">Settings</h1>

      <div className="bg-white border border-border rounded-lg p-6 mb-4">
        <h2 className="font-medium text-ink mb-4">Account</h2>
        <p className="text-sm text-muted mb-4">{user.email}</p>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Native language (for translations)
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
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="bg-terracotta text-white px-4 py-2 rounded text-sm font-medium hover:bg-terracotta-light transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save changes'}
          </button>
        </form>
      </div>

      <div className="bg-white border border-border rounded-lg p-6">
        <h2 className="font-medium text-ink mb-4">Session</h2>
        <button
          onClick={signOut}
          className="text-sm text-red-600 hover:underline"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
