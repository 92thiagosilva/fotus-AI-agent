import { BookOpen } from 'lucide-react'
import { DocumentUploader } from '@/components/knowledge/DocumentUploader'
import { DocumentList } from '@/components/knowledge/DocumentList'

export default function KnowledgePage() {
  return (
    <div className="h-full overflow-y-auto bg-slate-950">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Base de Conhecimento</h1>
            <p className="text-sm text-slate-400">
              Faça upload de documentos para o agente aprender e usar nas respostas
            </p>
          </div>
        </div>

        {/* Upload */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
            Adicionar Documentos
          </h2>
          <DocumentUploader />
        </section>

        {/* List */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
            Documentos Cadastrados
          </h2>
          <DocumentList />
        </section>
      </div>
    </div>
  )
}
