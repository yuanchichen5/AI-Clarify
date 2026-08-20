import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Windows + 中文路径下 fs.readlink 返回 EISDIR（Node 已知问题），
    // 关闭符号链接解析与文件系统缓存以规避（本项目不使用 node_modules 符号链接）
    config.resolve.symlinks = false;
    config.cache = false;
    return config;
  },
};

export default nextConfig;
