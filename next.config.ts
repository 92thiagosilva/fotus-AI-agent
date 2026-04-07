import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Pacotes Node.js nativos que não devem ser bundlados pelo Turbopack/webpack
  // pdf-parse usa DOMMatrix (API de browser) que quebra no server-side bundling
  serverExternalPackages: ['pdf-parse', 'mammoth', 'xlsx'],
}

export default nextConfig
