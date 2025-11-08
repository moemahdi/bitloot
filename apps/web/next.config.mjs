/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [],
  },
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
};

export default nextConfig;
