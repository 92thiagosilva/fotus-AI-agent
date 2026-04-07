'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Trash2, FileText, Image, Music, FileSpreadsheet, File, Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import useSWR from 'swr'

interface Document {
  id: string
  name: string
  file_type: string
  file_size: number
  status: 'processing' | 'ready' | 'error'
  error_msg?: string
  created_at: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function FileIcon({ type }: { type: string }) {
  const cls = 'w-4 h-4'
  if (type === 'image') return <Image className={cls} />
  if (type === 'audio') return <Music className={cls} />
  if (type === 'xlsx') return <FileSpreadsheet className={cls} />
  if (type === 'pdf' || type === 'docx') return <FileText className={cls} />
  return <File className={cls} />
}

function StatusBadge({ status }: { status: Document['status'] }) {
  if (status === 'processing')
    return <Badge variant="outline" className="border-yellow-700 text-yellow-400 gap-1 text-[10px]"><Loader2 className="w-2.5 h-2.5 animate-spin" />Processando</Badge>
  if (status === 'ready')
    return <Badge variant="outline" className="border-green-700 text-green-400 gap-1 text-[10px]"><CheckCircle className="w-2.5 h-2.5" />Pronto</Badge>
  return <Badge variant="outline" className="border-red-700 text-red-400 gap-1 text-[10px]"><AlertCircle className="w-2.5 h-2.5" />Erro</Badge>
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function DocumentList() {
  const { data: documents, mutate, isLoading } = useSWR<Document[]>('/api/documents', fetcher, {
    // Polling só quando há documentos em processamento; para quando tudo está pronto
    refreshInterval: (data) =>
      Array.isArray(data) && data.some((d) => d.status === 'processing') ? 4000 : 0,
  })
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeleting(id)
    await fetch(`/api/documents/${id}`, { method: 'DELETE' })
    mutate()
    setDeleting(null)
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-14 rounded-lg bg-slate-800/50 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!documents?.length) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-slate-500">
        <File className="w-8 h-8" />
        <p className="text-sm">Nenhum documento na base de conhecimento</p>
        <p className="text-xs">Faça upload de arquivos acima para o agente aprender</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700/30 hover:border-slate-600/50 transition-colors"
        >
          <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center shrink-0 text-slate-400">
            <FileIcon type={doc.file_type} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-200 truncate">{doc.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-slate-500">{formatBytes(doc.file_size)}</span>
              <span className="text-slate-700">·</span>
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                {formatDistanceToNow(new Date(doc.created_at), { locale: ptBR, addSuffix: true })}
              </span>
            </div>
          </div>

          <StatusBadge status={doc.status} />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(doc.id)}
            disabled={deleting === doc.id}
            className={cn(
              'h-7 w-7 text-slate-600 hover:text-red-400 shrink-0',
              deleting === doc.id && 'opacity-50'
            )}
          >
            {deleting === doc.id ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      ))}
    </div>
  )
}
