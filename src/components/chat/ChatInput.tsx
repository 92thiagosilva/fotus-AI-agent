'use client'

import { useRef, useState, KeyboardEvent } from 'react'
import { Send, Paperclip, StopCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { AudioRecorder } from './AudioRecorder'
import { FileAttachmentPreview } from './FileAttachmentPreview'
import { PendingAttachment } from '@/types/chat'
import { cn } from '@/lib/utils'

const ACCEPTED_TYPES = [
  'image/*', 'audio/*', 'video/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
].join(',')

interface ChatInputProps {
  onSend: (text: string, attachments: PendingAttachment[]) => void
  isStreaming: boolean
  onStop: () => void
  pendingAttachments: PendingAttachment[]
  onAddAttachment: (file: File) => void
  onRemoveAttachment: (id: string) => void
}

export function ChatInput({
  onSend,
  isStreaming,
  onStop,
  pendingAttachments,
  onAddAttachment,
  onRemoveAttachment,
}: ChatInputProps) {
  const [text, setText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleSend() {
    if (isStreaming) return onStop()
    if (!text.trim() && pendingAttachments.length === 0) return
    onSend(text.trim(), pendingAttachments)
    setText('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    Array.from(e.target.files ?? []).forEach(onAddAttachment)
    e.target.value = ''
  }

  return (
    <div className="border-t border-slate-800 bg-slate-900/95 backdrop-blur">
      <FileAttachmentPreview attachments={pendingAttachments} onRemove={onRemoveAttachment} />

      <div className="flex items-end gap-2 px-4 py-3">
        {/* Anexar arquivo */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isStreaming}
          className="h-8 w-8 text-slate-500 hover:text-white shrink-0"
          title="Anexar arquivo"
        >
          <Paperclip className="w-4 h-4" />
        </Button>

        {/* Audio recorder */}
        <AudioRecorder onRecorded={onAddAttachment} disabled={isStreaming} />

        {/* Textarea */}
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Pergunte sobre produtos, dimensionamento, comparativos..."
          disabled={isStreaming}
          rows={1}
          className={cn(
            'flex-1 resize-none bg-slate-800 border-slate-700 text-white placeholder:text-slate-500',
            'focus:border-yellow-500/50 focus:ring-0 rounded-xl min-h-[40px] max-h-[160px]',
            'py-2 px-3 text-sm leading-relaxed overflow-y-auto'
          )}
          style={{
            height: 'auto',
            minHeight: '40px',
          }}
          onInput={(e) => {
            const el = e.currentTarget
            el.style.height = 'auto'
            el.style.height = Math.min(el.scrollHeight, 160) + 'px'
          }}
        />

        {/* Enviar / Parar */}
        <Button
          type="button"
          onClick={handleSend}
          disabled={!isStreaming && !text.trim() && pendingAttachments.length === 0}
          className={cn(
            'h-8 w-8 shrink-0 rounded-lg',
            isStreaming
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-yellow-500 hover:bg-yellow-400 text-slate-900'
          )}
        >
          {isStreaming ? <StopCircle className="w-4 h-4" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>

      <p className="text-center text-[10px] text-slate-600 pb-2">
        Enter para enviar · Shift+Enter para nova linha
      </p>
    </div>
  )
}
