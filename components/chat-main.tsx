'use client'

import { useState, useEffect, useRef } from 'react';
import { createSupabaseClient } from '@/lib/supabase-client'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send } from 'lucide-react'

interface Message {
  id: number
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
}

interface User {
  id: string
  email: string
}

export function ChatMain({ selectedUser }: { selectedUser: User | null }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const supabase = createSupabaseClient()
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selectedUser) {
      fetchMessages()
      subscribeToMessages()
    }
  }, [selectedUser])

  async function fetchMessages() {
    if (!selectedUser) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .or(`sender_id.eq.${selectedUser.id},receiver_id.eq.${selectedUser.id}`)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching messages:', error)
    } else {
      setMessages(data || [])
    }
    scrollToBottom()
  }

  function subscribeToMessages() {
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const newMessage = payload.new as Message
        setMessages(prevMessages => [...prevMessages, newMessage])
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  async function handleSendMessage() {
    if (newMessage.trim() === '' || !selectedUser) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('messages')
      .insert({ 
        sender_id: user.id, 
        receiver_id: selectedUser.id, 
        content: newMessage 
      })
      .select()

    scrollToBottom()
    if (error) {
      console.error('Error sending message:', error)
    } else {
      setNewMessage('')
      // Update last interaction
      await supabase
        .from('user_interactions')
        .upsert([
          { user_id: user.id, other_user_id: selectedUser.id, last_interaction: new Date().toISOString() },
          { user_id: selectedUser.id, other_user_id: user.id, last_interaction: new Date().toISOString() }
        ])
    }
  }

  function scrollToBottom() {
    if (scrollAreaRef.current) {
      setTimeout(() => {
        scrollAreaRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
      }, 150)
    }
  }

  if (!selectedUser) {
    return <div className="flex-1 flex items-center justify-center">Select a user to start chatting</div>
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b p-4 flex items-center">
        <Avatar className="w-10 h-10 mr-4">
          <AvatarImage src={`https://i.pravatar.cc/40?u=${selectedUser.id}`} />
          <AvatarFallback>{selectedUser.email[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <div className="font-semibold">{selectedUser.email}</div>
        </div>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender_id === selectedUser.id ? 'justify-start' : 'justify-end'}`}>
              <div className={`rounded-lg p-2 max-w-[70%] ${message.sender_id === selectedUser.id ? 'bg-gray-200' : 'bg-blue-500 text-white'}`}>
                {message.content}
              </div>
            </div>
          ))}
          <div ref={scrollAreaRef} />
        </div>
      </ScrollArea>
      <div className="border-t p-4 flex items-center">
        <Input 
          className="flex-1 mr-2" 
          placeholder="Type a message..." 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSendMessage()
            }
          }}
        />
        <Button size="icon" onClick={handleSendMessage}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

