'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Message } from '@/types/chat'
import { Zap, User, FileText, Image, Music } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MessageBubbleProps {
  message: Message
  isStreaming?: boolean
}

function AttachmentChip({ name, mimeType }: { name: string; mimeType: string }) {
  const Icon = mimeType.startsWith('image/')
    ? Image
    : mimeType.startsWith('audio/')
    ? Music
    : FileText

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-700/60 text-xs text-slate-300 border border-slate-600/40">
      <Icon className="w-3 h-3 shrink-0" />
      <span className="truncate max-w-[160px]">{name}</span>
    </div>
  )
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex gap-3 px-4 py-3', isUser ? 'justify-end' : 'justify-start')}>
      {/* Avatar do assistente */}
      {!isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-yellow-500/15 flex items-center justify-center mt-0.5">
          <Zap className="w-3.5 h-3.5 text-yellow-400" />
        </div>
      )}

      <div className={cn('flex flex-col gap-1.5 max-w-[80%]', isUser && 'items-end')}>
        {/* Attachments do usuário */}
        {isUser && message.attachments?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-end">
            {message.attachments.map((att, i) => (
              <AttachmentChip key={i} name={att.name} mimeType={att.mimeType} />
            ))}
          </div>
        )}

        {/* Bubble */}
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-sm leading-relaxed',
            isUser
              ? 'bg-yellow-500 text-slate-900 font-medium rounded-br-sm'
              : 'bg-slate-800 text-slate-100 rounded-bl-sm border border-slate-700/50'
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className ?? '')
                  const isBlock = !!match
                  return isBlock ? (
                    <SyntaxHighlighter
                      style={oneDark}
                      language={match[1]}
                      PreTag="div"
                      className="rounded-md text-xs my-2"
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className="bg-slate-700 rounded px-1 py-0.5 text-xs font-mono" {...props}>
                      {children}
                    </code>
                  )
                },
                table({ children }) {
                  return (
                    <div className="overflow-x-auto my-2">
                      <table className="border-collapse text-xs w-full">{children}</table>
                    </div>
                  )
                },
                th({ children }) {
                  return (
                    <th className="border border-slate-600 px-3 py-1.5 bg-slate-700 text-left font-semibold">
                      {children}
                    </th>
                  )
                },
                td({ children }) {
                  return (
                    <td className="border border-slate-700 px-3 py-1.5">{children}</td>
                  )
                },
                p({ children }) {
                  return <p className="mb-2 last:mb-0">{children}</p>
                },
                ul({ children }) {
                  return <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>
                },
                ol({ children }) {
                  return <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}

          {/* Cursor piscando durante streaming */}
          {isStreaming && !isUser && (
            <span className="inline-block w-1.5 h-4 bg-yellow-400 ml-0.5 animate-pulse rounded-sm" />
          )}
        </div>
      </div>

      {/* Avatar do usuário */}
      {isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center mt-0.5">
          <User className="w-3.5 h-3.5 text-slate-300" />
        </div>
      )}
    </div>
  )
}
