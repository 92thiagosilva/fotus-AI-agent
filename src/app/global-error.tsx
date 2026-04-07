'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <html>
      <body style={{ background: '#020617', color: '#f8fafc', fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', margin: 0 }}>
        <div style={{ textAlign: 'center', maxWidth: '400px', padding: '24px' }}>
          <p style={{ fontSize: '2rem', marginBottom: '16px' }}>⚠️</p>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Erro crítico na aplicação</h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '16px', wordBreak: 'break-word' }}>
            {error.message ?? 'Ocorreu um erro inesperado.'}
          </p>
          {error.digest && (
            <p style={{ fontSize: '0.75rem', color: '#475569', fontFamily: 'monospace', marginBottom: '16px' }}>
              ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{ background: '#eab308', color: '#0f172a', border: 'none', padding: '8px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  )
}
