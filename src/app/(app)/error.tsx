'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[AppError]', error)
  }, [error])

  return (
    <div className="flex h-screen items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4 px-6 text-center max-w-md">
        <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-red-400" />
        </div>
        <h2 className="text-lg font-semibold text-white">Algo deu errado</h2>
        <p className="text-sm text-slate-400 break-words">
          {error.message ?? 'Erro inesperado na aplicação.'}
        </p>
        {error.digest && (
          <p className="text-xs text-slate-600 font-mono">ID: {error.digest}</p>
        )}
        <Button
          onClick={reset}
          className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-semibold mt-2"
        >
          Tentar novamente
        </Button>
      </div>
    </div>
  )
}
