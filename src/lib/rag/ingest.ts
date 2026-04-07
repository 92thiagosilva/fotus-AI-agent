import { createServiceClient } from '@/lib/supabase/server'
import { embedTextBatch } from '@/lib/gemini/embeddings'
import { chunkText } from './chunker'
import { extractPdfText } from '@/lib/processors/pdf'
import { extractDocxText } from '@/lib/processors/docx'
import { extractXlsxText } from '@/lib/processors/xlsx'
import { extractImageText } from '@/lib/processors/image'
import { extractAudioText } from '@/lib/processors/audio'

/**
 * Extrai texto de um arquivo baseado no MIME type.
 */
async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === 'application/pdf') {
    return extractPdfText(buffer)
  }
  if (
    mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    return extractDocxText(buffer)
  }
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.ms-excel'
  ) {
    return extractXlsxText(buffer)
  }
  if (mimeType.startsWith('image/')) {
    return extractImageText(buffer, mimeType)
  }
  if (mimeType.startsWith('audio/')) {
    return extractAudioText(buffer, mimeType)
  }
  // Fallback: tenta ler como texto
  return buffer.toString('utf-8')
}

/**
 * Pipeline completo de ingestão de documento:
 * 1. Extrai texto
 * 2. Divide em chunks
 * 3. Gera embeddings
 * 4. Salva no Supabase
 * 5. Atualiza status do documento
 */
export async function ingestDocument(documentId: string): Promise<number> {
  const supabase = createServiceClient()

  // Busca documento
  const { data: doc, error: docError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .single()

  if (docError || !doc) {
    throw new Error(`Documento não encontrado: ${documentId}`)
  }

  try {
    // Baixa arquivo do Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('knowledge-base')
      .download(doc.storage_path)

    if (downloadError || !fileData) {
      throw new Error(`Erro ao baixar arquivo: ${downloadError?.message}`)
    }

    const buffer = Buffer.from(await fileData.arrayBuffer())

    // Extrai texto
    const text = await extractText(buffer, doc.mime_type)

    if (!text.trim()) {
      throw new Error('Nenhum texto extraído do arquivo')
    }

    // Divide em chunks
    const chunks = chunkText(text, {
      metadata: { document_name: doc.name, file_type: doc.file_type },
    })

    if (chunks.length === 0) {
      throw new Error('Nenhum chunk gerado')
    }

    // Gera embeddings em lote
    const embeddings = await embedTextBatch(chunks.map((c) => c.content))

    // Insere chunks no banco
    const chunkRows = chunks.map((chunk, i) => ({
      document_id: documentId,
      content: chunk.content,
      embedding: JSON.stringify(embeddings[i]),
      chunk_index: chunk.chunkIndex,
      token_count: chunk.tokenCount,
      metadata: chunk.metadata,
    }))

    const { error: insertError } = await supabase
      .from('document_chunks')
      .insert(chunkRows)

    if (insertError) {
      throw new Error(`Erro ao inserir chunks: ${insertError.message}`)
    }

    // Atualiza status para 'ready'
    await supabase
      .from('documents')
      .update({ status: 'ready' })
      .eq('id', documentId)

    return chunks.length
  } catch (error) {
    // Atualiza status para 'error'
    await supabase
      .from('documents')
      .update({
        status: 'error',
        error_msg: error instanceof Error ? error.message : 'Erro desconhecido',
      })
      .eq('id', documentId)

    throw error
  }
}
