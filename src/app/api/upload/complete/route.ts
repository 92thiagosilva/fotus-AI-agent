import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ingestDocument } from '@/lib/rag/ingest'

/**
 * POST /api/upload/complete
 * Chamado pelo browser após o upload direto ao Supabase Storage.
 * Dispara o pipeline de ingestão (extração → chunks → embeddings → banco).
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  const { documentId } = body as { documentId?: string }

  if (!documentId) {
    return NextResponse.json({ error: 'documentId é obrigatório' }, { status: 400 })
  }

  const docId = documentId
  after(async () => {
    try {
      console.log('[upload/complete] Iniciando ingestão:', docId)
      const chunks = await ingestDocument(docId)
      console.log('[upload/complete] Ingestão concluída:', docId, '— chunks:', chunks)
    } catch (err) {
      console.error('[upload/complete] Erro na ingestão:', docId, err)
    }
  })

  return NextResponse.json({ status: 'processing' })
}
