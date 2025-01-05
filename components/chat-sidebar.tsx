'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase-client'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"

interface User {
  id: string
  email: string
  last_interaction: string
}

export function ChatSidebar({ onSelectUser }: { onSelectUser: (user: User) => void }) {
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createSupabaseClient()

  useEffect(() => {
    fetchRecentUsers()
  }, [])

  async function fetchRecentUsers() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('user_interactions')
      .select('other_user_id, last_interaction, users!user_interactions_other_user_id_fkey1(email)')
      .eq('user_id', user.id)
      .order('last_interaction', { ascending: false })
      .limit(10)

    const dataUsers = data as any || []

    console.log('dataUsers', dataUsers);

    if (error) {
      console.error('Error fetching recent users:', error)
    } else {
      setUsers(dataUsers.map(interaction => ({
        id: interaction.other_user_id,
        email: interaction.users.email,
        last_interaction: interaction.last_interaction
      })))
    }
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="w-80 border-r bg-gray-50 flex flex-col">
      <div className="p-4 border-b">
        <Input 
          placeholder="Search users..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {filteredUsers.map((user) => (
            <Button 
              key={user.id} 
              variant="ghost" 
              className="w-full justify-start"
              onClick={() => onSelectUser(user)}
            >
              <Avatar className="w-10 h-10 mr-4">
                <AvatarImage src={`https://i.pravatar.cc/40?u=${user.id}`} />
                <AvatarFallback>{user.email[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="text-left">
                <div className="font-semibold">{user.email}</div>
                <div className="text-sm text-gray-500">
                  {new Date(user.last_interaction).toLocaleDateString()}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

