'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase-client'
import { ChatSidebar } from '@/components/chat-sidebar'
import { ChatMain } from '@/components/chat-main'
import { AuthForm } from '@/components/auth-form'
import { Loader2 } from 'lucide-react'

interface User {
  id: string
  email: string
}

export default function ChatPage() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const supabase = createSupabaseClient()

  useEffect(() => {
    const minLoadTime = 1000 // Minimum loading time in milliseconds

    const checkSession = async () => {
      const startTime = Date.now()
      const { data: { session } } = await supabase.auth.getSession()

      const elapsedTime = Date.now() - startTime
      const remainingTime = Math.max(0, minLoadTime - elapsedTime)

      // Ensure the loading state lasts for at least the minimum time
      setTimeout(() => {
        setSession(session)
        setLoading(false)
      }, remainingTime)
    }

    checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6 text-center">Welcome to Chat App</h1>
          <AuthForm />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <ChatSidebar onSelectUser={setSelectedUser} />
      <ChatMain selectedUser={selectedUser} />
    </div>
  )
}

