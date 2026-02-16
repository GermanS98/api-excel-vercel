import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  generateBuildId: async () => {
    // Force unique build ID to bust all caches
    return `build-${Date.now()}`;
  },
};

export default nextConfig;
