'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import { useChat } from '@/hooks/useChat'
import { Message } from '@/types/chat'
import { Zap } from 'lucide-react'

const SUGGESTED_QUESTIONS = [
  'Compare o inversor Growatt vs Sungrow para um sistema de 5kWp',
  'Dimensione um kit para consumo mensal de 400 kWh',
  'Quais módulos são compatíveis com o inversor Deye 5kW?',
  'Analise este orçamento do concorrente',
  'Quais as vantagens do microinversor frente ao inversor string?',
]

interface ChatWindowProps {
  conversationId?: string
  initialMessages?: Message[]
}

export function ChatWindow({ conversationId, initialMessages }: ChatWindowProps) {
  const router = useRouter()
  const bottomRef = useRef<HTMLDivElement>(null)

  const {
    messages,
    isStreaming,
    pendingAttachments,
    sendMessage,
    stopStreaming,
    addAttachment,
    removeAttachment,
  } = useChat({
    conversationId,
    initialMessages,
    onConversationCreated: (id) => {
      router.replace(`/chat/${id}`)
    },
  })

  // Auto-scroll para o fim
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full gap-6 px-6 pb-24">
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Zap className="w-7 h-7 text-yellow-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Olá! Sou o Agente Fotus</h2>
              <p className="text-slate-400 text-sm text-center max-w-sm">
                Especialista em equipamentos fotovoltaicos. Tire dúvidas técnicas, compare produtos, dimensione kits e analise orçamentos de concorrentes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q, [])}
                  className="text-left px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-slate-300 hover:text-white text-sm transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-4">
            {messages.map((msg, i) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isStreaming={isStreaming && i === messages.length - 1 && msg.role === 'assistant'}
              />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        isStreaming={isStreaming}
        onStop={stopStreaming}
        pendingAttachments={pendingAttachments}
        onAddAttachment={addAttachment}
        onRemoveAttachment={removeAttachment}
      />
    </div>
  )
}
