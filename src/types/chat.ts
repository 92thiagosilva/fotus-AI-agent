export interface Message {
  id: string
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  attachments: Attachment[]
  createdAt: string
}

export interface Attachment {
  name: string
  url?: string
  mimeType: string
  storagePath?: string
  // Para arquivos ainda não enviados (pending)
  file?: File
  preview?: string // URL de preview local (URL.createObjectURL)
}

export interface Conversation {
  id: string
  title: string | null
  createdAt: string
  updatedAt: string
  messages?: Message[]
}

export interface PendingAttachment {
  id: string // UUID local
  file: File
  preview?: string
  uploading: boolean
  uploaded?: boolean
  storagePath?: string
  url?: string
}
