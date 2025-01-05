'use client'

import { useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase-client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function AuthForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createSupabaseClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setError(error.message)
    else setError("Check your email for the confirmation link.")
    setLoading(false)
  }

  return (
    <form className="space-y-4">
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <div className="flex space-x-2">
        <Button onClick={handleLogin} disabled={loading}>Login</Button>
        <Button onClick={handleSignUp} disabled={loading}>Sign Up</Button>
      </div>
      {error && <p className="text-red-500">{error}</p>}
    </form>
  )
}

