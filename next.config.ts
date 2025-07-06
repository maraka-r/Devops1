/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // L'option instrumentationHook n'est plus nécessaire dans les versions récentes de Next.js
  // car instrumentation.js est disponible par défaut
}

module.exports = nextConfig