import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
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

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 })
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'Arquivo muito grande (máx 50 MB)' }, { status: 400 })

  const fileType = ALLOWED_MIME_TYPES[file.type]
  if (!fileType) return NextResponse.json({ error: `Tipo de arquivo não suportado: ${file.type}` }, { status: 400 })

  const serviceClient = createServiceClient()
  const buffer = Buffer.from(await file.arrayBuffer())
  const storagePath = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

  const { error: uploadError } = await serviceClient.storage
    .from('knowledge-base')
    .upload(storagePath, buffer, { contentType: file.type })

  if (uploadError) {
    return NextResponse.json({ error: `Erro ao fazer upload: ${uploadError.message}` }, { status: 500 })
  }

  const { data: doc, error: dbError } = await serviceClient
    .from('documents')
    .insert({
      name: file.name,
      file_type: fileType,
      storage_path: storagePath,
      file_size: file.size,
      mime_type: file.type,
      status: 'processing',
      created_by: user.id,
    })
    .select()
    .single()

  if (dbError) {
    return NextResponse.json({ error: `Erro ao salvar metadados: ${dbError.message}` }, { status: 500 })
  }

  // Dispara ingestão após a resposta ser enviada (after garante execução no Vercel)
  const ingestUrl = new URL('/api/ingest', request.url).toString()
  const serviceToken = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const docId = doc.id
  after(async () => {
    try {
      await fetch(ingestUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-service-token': serviceToken },
        body: JSON.stringify({ documentId: docId }),
      })
    } catch (err) {
      console.error('Erro ao chamar /api/ingest:', err)
    }
  })

  return NextResponse.json({ documentId: doc.id, status: 'processing' })
}
