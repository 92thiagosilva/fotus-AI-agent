import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/session'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { notFound } from 'next/navigation'

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await requireAuth()
  const supabase = await createClient()

  const { data: conversation } = await supabase
    .from('conversations')
    .select('*, messages(id, role, content, attachments, created_at)')
    .eq('id', id)
    .order('created_at', { ascending: true, foreignTable: 'messages' })
    .single()

  if (!conversation) notFound()

  const messages = (conversation.messages ?? []).map((m: {
    id: string
    role: string
    content: string
    attachments: unknown[]
    created_at: string
  }) => ({
    id: m.id,
    conversationId: id,
    role: m.role as 'user' | 'assistant',
    content: m.content,
    attachments: m.attachments ?? [],
    createdAt: m.created_at,
  }))

  return <ChatWindow conversationId={id} initialMessages={messages} />
}
