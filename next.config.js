/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['d3', 'd3-voronoi-treemap'],
  },
}

module.exports = nextConfig
