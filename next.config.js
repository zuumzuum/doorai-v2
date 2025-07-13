/** @type {import('next').NextConfig} */
const nextConfig = {
  srcDir: 'src',
  reactStrictMode: true,
  swcMinify: true,
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
}

module.exports = nextConfig