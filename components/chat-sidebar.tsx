'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase-client'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, Settings } from 'lucide-react'
import Link from 'next/link'

interface ChatUser {
  id: string
  email: string
  last_interaction: string
}

export function ChatSidebar({ onSelectUser }: { onSelectUser: (user: ChatUser) => void }) {
  const [users, setUsers] = useState<ChatUser[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const supabase = createSupabaseClient()

  useEffect(() => {
    fetchRecentUsers()
    fetchCurrentUser()
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

  async function fetchCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  return (
    <div className="w-80 border-r bg-gray-50 flex flex-col h-screen">
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
                <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${user.email}`} />
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
      {currentUser && (
        <div className="p-4 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start">
                <Avatar className="w-10 h-10 mr-4">
                  <AvatarImage src={currentUser.user_metadata.avatar_url || `https://api.dicebear.com/6.x/initials/svg?seed=${currentUser.email}`} />
                  <AvatarFallback>{currentUser.email[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <div className="font-semibold">{currentUser.email}</div>
                  <div className="text-sm text-gray-500">
                    {currentUser.user_metadata.full_name || 'Set your name'}
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{currentUser.email}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {currentUser.user_metadata.full_name || 'Set your name'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )
}

