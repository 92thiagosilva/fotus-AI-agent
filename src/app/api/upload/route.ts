import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-excel': 'xlsx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'image/gif': 'image',
  'audio/mpeg': 'audio',
  'audio/wav': 'audio',
  'audio/webm': 'audio',
  'audio/ogg': 'audio',
  'video/mp4': 'video',
  'video/webm': 'video',
}

/**
 * POST /api/upload
 * Recebe apenas os metadados do arquivo (nome, tamanho, tipo).
 * Cria o registro no banco e retorna uma signed upload URL para o
 * browser fazer o upload diretamente ao Supabase Storage — sem passar
 * pelos servidores Vercel, evitando o limite de 10s do plano Hobby.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  const { name, size, mimeType } = body as { name?: string; size?: number; mimeType?: string }

  if (!name || !size || !mimeType) {
    return NextResponse.json({ error: 'name, size e mimeType são obrigatórios' }, { status: 400 })
  }
  if (size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'Arquivo muito grande (máx 50 MB)' }, { status: 400 })
  }

  const fileType = ALLOWED_MIME_TYPES[mimeType]
  if (!fileType) {
    return NextResponse.json({ error: `Tipo de arquivo não suportado: ${mimeType}` }, { status: 400 })
  }

  const serviceClient = createServiceClient()
  const storagePath = `${user.id}/${Date.now()}-${name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

  // Cria o registro no banco antes do upload
  const { data: doc, error: dbError } = await serviceClient
    .from('documents')
    .insert({
      name,
      file_type: fileType,
      storage_path: storagePath,
      file_size: size,
      mime_type: mimeType,
      status: 'processing',
      created_by: user.id,
    })
    .select()
    .single()

  if (dbError) {
    return NextResponse.json({ error: `Erro ao salvar metadados: ${dbError.message}` }, { status: 500 })
  }

  // Gera URL assinada para upload direto do browser → Supabase Storage
  const { data: signedData, error: signedError } = await serviceClient.storage
    .from('knowledge-base')
    .createSignedUploadUrl(storagePath)

  if (signedError || !signedData) {
    // Limpa o registro criado
    await serviceClient.from('documents').delete().eq('id', doc.id)
    return NextResponse.json({ error: `Erro ao gerar URL de upload: ${signedError?.message}` }, { status: 500 })
  }

  return NextResponse.json({
    documentId: doc.id,
    storagePath,
    signedUrl: signedData.signedUrl,
    token: signedData.token,
  })
}
