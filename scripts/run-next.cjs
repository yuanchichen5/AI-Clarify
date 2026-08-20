
// scripts/run-next.cjs
// 统一入口：注入 readlink 补丁后调用 next CLI
// 用法：node scripts/run-next.cjs <next 参数...>
"use strict";
const { spawn } = require("child_process");
const path = require("path");

const patchPath = path.join(__dirname, "patch-readlink.cjs");
const nextBin = path.join(__dirname, "..", "node_modules", "next", "dist", "bin", "next");

// 注入 NODE_OPTIONS，子进程（webpack worker 等）自动继承
const extra = `--require=${patchPath}`;
process.env.NODE_OPTIONS = [process.env.NODE_OPTIONS, extra].filter(Boolean).join(" ");

const child = spawn(process.execPath, [nextBin, ...process.argv.slice(2)], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  process.exit(signal ? 1 : (code ?? 0));
});
child.on("error", (err) => {
  console.error("[run-next] 启动失败:", err.message);
  process.exit(1);
});
