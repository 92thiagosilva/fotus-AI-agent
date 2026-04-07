// eslint-disable-next-line @typescript-eslint/no-require-imports
const mammoth = require('mammoth')

export async function extractDocxText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer })
  return result.value
}
