'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase-client'
import { ChatSidebar } from '@/components/chat-sidebar'
import { ChatMain } from '@/components/chat-main'
import { AuthForm } from '@/components/auth-form'

interface User {
  id: string
  email: string
}

export default function ChatPage() {
  const [session, setSession] = useState<any>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const supabase = createSupabaseClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md">
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

