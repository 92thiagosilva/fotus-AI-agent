// eslint-disable-next-line @typescript-eslint/no-require-imports
const XLSX = require('xlsx')

/**
 * Converte planilha Excel em texto estruturado (CSV por aba).
 */
export function extractXlsxText(buffer: Buffer): string {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const parts: string[] = []

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const csv = XLSX.utils.sheet_to_csv(sheet)

    // Remove linhas completamente vazias
    const cleaned = csv
      .split('\n')
      .filter((line: string) => line.replace(/,/g, '').trim())
      .join('\n')

    if (cleaned.trim()) {
      parts.push(`=== Aba: ${sheetName} ===\n${cleaned}`)
    }
  }

  return parts.join('\n\n')
}
