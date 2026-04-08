'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, CheckCircle, AlertCircle, Loader2, FileText, Image, Music } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UploadResult {
  name: string
  status: 'uploading' | 'processing' | 'ready' | 'error'
  error?: string
}

export function DocumentUploader({ onUploaded }: { onUploaded?: () => void }) {
  const [results, setResults] = useState<UploadResult[]>([])

  async function uploadFile(file: File) {
    setResults((prev) => [...prev, { name: file.name, status: 'uploading' }])

    const update = (status: UploadResult['status'], error?: string) =>
      setResults((prev) =>
        prev.map((r) => (r.name === file.name ? { ...r, status, error } : r))
      )

    try {
      // Etapa 1: solicita signed URL ao servidor (envia apenas metadados, sem o arquivo)
      const metaRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: file.name, size: file.size, mimeType: file.type }),
      })
      const metaData = await metaRes.json()

      if (!metaRes.ok) {
        update('error', metaData.error ?? 'Erro ao iniciar upload')
        return
      }

      // Etapa 2: upload direto do browser → Supabase Storage (não passa pelo Vercel)
      const uploadRes = await fetch(metaData.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })

      if (!uploadRes.ok) {
        update('error', 'Falha no upload do arquivo')
        return
      }

      // Etapa 3: notifica o servidor para iniciar a ingestão
      await fetch('/api/upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: metaData.documentId }),
      })

      update('processing')

      // Polling até status = ready ou error
      let attempts = 0
      while (attempts < 60) {
        await new Promise((r) => setTimeout(r, 3000))
        const statusRes = await fetch(`/api/documents/${metaData.documentId}`)
        const statusData = await statusRes.json()

        if (statusData.status === 'ready') {
          update('ready')
          onUploaded?.()
          return
        }
        if (statusData.status === 'error') {
          update('error', statusData.error_msg ?? 'Erro no processamento')
          return
        }
        attempts++
      }

      update('error', 'Timeout no processamento')
    } catch {
      update('error', 'Erro de rede')
    }
  }

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      acceptedFiles.forEach(uploadFile)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
      'audio/*': ['.mp3', '.wav', '.webm'],
    },
    maxSize: 50 * 1024 * 1024,
  })

  function StatusIcon({ status }: { status: UploadResult['status'] }) {
    if (status === 'uploading' || status === 'processing')
      return <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
    if (status === 'ready') return <CheckCircle className="w-4 h-4 text-green-400" />
    return <AlertCircle className="w-4 h-4 text-red-400" />
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-yellow-500 bg-yellow-500/5'
            : 'border-slate-700 hover:border-slate-600 bg-slate-800/30'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <Upload className={cn('w-8 h-8', isDragActive ? 'text-yellow-400' : 'text-slate-500')} />
          <div>
            <p className="text-sm font-medium text-slate-300">
              {isDragActive ? 'Solte os arquivos aqui' : 'Arraste arquivos ou clique para selecionar'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              PDF, DOCX, XLSX, imagens, áudio · Máx 50 MB por arquivo
            </p>
          </div>
          <div className="flex gap-3 text-slate-600">
            <FileText className="w-5 h-5" />
            <Image className="w-5 h-5" />
            <Music className="w-5 h-5" />
          </div>
        </div>
      </div>

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((r, i) => (
            <div
              key={`${r.name}-${i}`}
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
            >
              <StatusIcon status={r.status} />
              <span className="flex-1 text-sm text-slate-300 truncate">{r.name}</span>
              <span className={cn('text-xs', {
                'text-yellow-400': r.status === 'uploading' || r.status === 'processing',
                'text-green-400': r.status === 'ready',
                'text-red-400': r.status === 'error',
              })}>
                {r.status === 'uploading' ? 'Enviando...'
                  : r.status === 'processing' ? 'Processando...'
                  : r.status === 'ready' ? 'Pronto'
                  : r.error ?? 'Erro'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
