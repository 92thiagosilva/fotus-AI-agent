import { NextRequest, NextResponse } from 'next/server'
import { ingestDocument } from '@/lib/rag/ingest'

export async function POST(request: NextRequest) {
  // Verifica token de serviço (chamada interna)
  const serviceToken = request.headers.get('x-service-token')
  if (serviceToken !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { documentId } = await request.json()
  if (!documentId) {
    return NextResponse.json({ error: 'documentId obrigatório' }, { status: 400 })
  }

  try {
    const chunksCreated = await ingestDocument(documentId)
    return NextResponse.json({ status: 'ready', chunksCreated })
  } catch (error) {
    console.error('Erro na ingestão:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro na ingestão' },
      { status: 500 }
    )
  }
}
