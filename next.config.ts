/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // L'option instrumentationHook n'est plus nécessaire dans les versions récentes de Next.js
  // car instrumentation.js est disponible par défaut
}

module.exports = nextConfig