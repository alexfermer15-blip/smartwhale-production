/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // ⚠️ Временно игнорируем TypeScript ошибки при сборке
    ignoreBuildErrors: true,
  },
  eslint: {
    // ⚠️ Временно игнорируем ESLint предупреждения
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
