'use client'

import { X, FileText, Music, Video, File } from 'lucide-react'
import { PendingAttachment } from '@/types/chat'
import { cn } from '@/lib/utils'

interface FileAttachmentPreviewProps {
  attachments: PendingAttachment[]
  onRemove: (id: string) => void
}

function FileIcon({ mimeType, className }: { mimeType: string; className?: string }) {
  if (mimeType.startsWith('audio/')) return <Music className={className} />
  if (mimeType.startsWith('video/')) return <Video className={className} />
  if (mimeType === 'application/pdf') return <FileText className={className} />
  return <File className={className} />
}

export function FileAttachmentPreview({ attachments, onRemove }: FileAttachmentPreviewProps) {
  if (attachments.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 px-3 pt-2">
      {attachments.map((att) => (
        <div
          key={att.id}
          className={cn(
            'group relative flex items-center gap-2 rounded-lg border px-3 py-2 text-xs bg-slate-800 border-slate-700',
            att.uploading && 'opacity-60'
          )}
        >
          {/* Preview de imagem ou ícone */}
          {att.preview ? (
            <img
              src={att.preview}
              alt={att.file.name}
              className="w-8 h-8 rounded object-cover shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center shrink-0">
              <FileIcon mimeType={att.file.type} className="w-4 h-4 text-slate-400" />
            </div>
          )}

          <div className="flex flex-col min-w-0">
            <span className="text-slate-200 truncate max-w-[120px]">{att.file.name}</span>
            <span className="text-slate-500 text-[10px]">
              {att.uploading
                ? 'Enviando...'
                : att.uploaded
                ? 'Pronto'
                : (att.file.size / 1024 / 1024).toFixed(1) + ' MB'}
            </span>
          </div>

          {/* Remove button */}
          {!att.uploading && (
            <button
              onClick={() => onRemove(att.id)}
              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-slate-600 text-slate-200 hover:bg-red-500 hover:text-white flex items-center justify-center"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
