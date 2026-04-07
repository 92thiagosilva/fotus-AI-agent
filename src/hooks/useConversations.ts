'use client'

import useSWR from 'swr'
import { Conversation } from '@/types/chat'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useConversations() {
  const { data, error, mutate, isLoading } = useSWR<Conversation[]>(
    '/api/conversations',
    fetcher,
    { refreshInterval: 0, revalidateOnFocus: false }
  )

  async function deleteConversation(id: string) {
    await fetch(`/api/conversations/${id}`, { method: 'DELETE' })
    mutate()
  }

  return {
    conversations: data ?? [],
    isLoading,
    error,
    mutate,
    deleteConversation,
  }
}
