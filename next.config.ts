// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone', // Importante para Netlify
  images: {
    unoptimized: true, // Netlify não suporta otimização padrão
  },
}

export default nextConfig