'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, Trash2, MessageSquare, BookOpen, LogOut, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useConversations } from '@/hooks/useConversations'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Conversation } from '@/types/chat'

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { conversations, deleteConversation, isLoading } = useConversations()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.preventDefault()
    e.stopPropagation()
    await deleteConversation(id)
    if (pathname === `/chat/${id}`) router.push('/chat')
  }

  return (
    <aside className="flex flex-col h-full w-64 bg-slate-900 border-r border-slate-800">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-slate-800">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500/10">
          <Zap className="w-4 h-4 text-yellow-400" />
        </div>
        <span className="font-bold text-white text-sm">Agente Fotus</span>
      </div>

      {/* New Chat */}
      <div className="px-3 py-3">
        <Link href="/chat">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white text-sm"
          >
            <Plus className="w-4 h-4" />
            Nova conversa
          </Button>
        </Link>
      </div>

      {/* Navigation */}
      <div className="px-3 pb-2">
        <Link href="/knowledge">
          <Button
            variant="ghost"
            className={cn(
              'w-full justify-start gap-2 text-slate-400 hover:text-white hover:bg-slate-800 text-sm',
              pathname === '/knowledge' && 'bg-slate-800 text-white'
            )}
          >
            <BookOpen className="w-4 h-4" />
            Base de Conhecimento
          </Button>
        </Link>
      </div>

      <Separator className="bg-slate-800" />

      {/* Conversations */}
      <ScrollArea className="flex-1 px-3 py-2">
        <p className="text-xs text-slate-500 px-2 py-1 mb-1 uppercase tracking-wide">Conversas</p>
        {isLoading ? (
          <div className="space-y-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-9 rounded-md bg-slate-800/50 animate-pulse" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <p className="text-xs text-slate-500 px-2 py-4 text-center">Nenhuma conversa ainda</p>
        ) : (
          <div className="space-y-0.5">
            {conversations.map((conv: Conversation) => {
              const isActive = pathname === `/chat/${conv.id}`
              return (
                <Link key={conv.id} href={`/chat/${conv.id}`}>
                  <div
                    className={cn(
                      'group flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer transition-colors',
                      isActive
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    )}
                  >
                    <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-60" />
                    <span className="flex-1 truncate text-xs">
                      {conv.title ?? 'Nova conversa'}
                    </span>
                    <span className="text-xs text-slate-600 group-hover:hidden shrink-0">
                      {formatDistanceToNow(new Date(conv.updatedAt), { locale: ptBR, addSuffix: false })}
                    </span>
                    <button
                      onClick={(e) => handleDelete(e, conv.id)}
                      className="hidden group-hover:flex text-slate-500 hover:text-red-400 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </ScrollArea>

      {/* Logout */}
      <div className="px-3 py-3 border-t border-slate-800">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-2 text-slate-500 hover:text-white hover:bg-slate-800 text-sm"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </Button>
      </div>
    </aside>
  )
}
