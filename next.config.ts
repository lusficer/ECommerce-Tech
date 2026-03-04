import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    domains: ["via.placeholder.com", "img.freepik.com"],
  },
};

export default nextConfig;
