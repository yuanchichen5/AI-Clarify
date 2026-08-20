
// scripts/patch-readlink.cjs
// Windows + 中文路径下 Node fs.readlink 返回 EISDIR 的兼容补丁
// 真实缺陷：nodejs/node 在 Windows 对非 ASCII 路径的普通文件执行 readlink 抛 EISDIR
// 处理：将 EISDIR 归一化为 EINVAL（与 Linux 上"非符号链接"的 readlink 行为一致），
//       调用方按"非符号链接"处理，避免误判为符号链接导致解析递归。
"use strict";
const fs = require("fs");

const origReadlinkSync = fs.readlinkSync;
const origReadlink = fs.readlink;

function toEINVAL(p) {
  const err = new Error(`invalid argument, readlink '${p}'`);
  err.code = "EINVAL";
  err.errno = -22;
  err.path = p;
  err.syscall = "readlink";
  return err;
}

const isBenign = (e) =>
  e && (e.code === "EISDIR" || e.code === "ENOENT" || e.code === "ENOTDIR");

fs.readlinkSync = function readlinkSync(p, ...args) {
  try {
    return origReadlinkSync(p, ...args);
  } catch (e) {
    if (e && e.code === "EINVAL") throw e; // 原本就是非链接
    if (isBenign(e)) throw toEINVAL(p);
    throw e;
  }
};

fs.readlink = function readlink(p, ...args) {
  const cb = typeof args[args.length - 1] === "function" ? args.pop() : null;
  if (!cb) {
    return origReadlink.call(this, p, ...args);
  }
  return origReadlink.call(this, p, ...args, (err, target) => {
    if (err) {
      if (err.code === "EINVAL") return cb(err, target);
      if (isBenign(err)) return cb(toEINVAL(p), null);
    }
    cb(err, target);
  });
};


// ---- fs.promises.readlink 同样打补丁（Next 数据收集阶段使用 promise 版本） ----
const fsp = fs.promises;
const origPromReadlink = fsp.readlink;
fsp.readlink = function promReadlink(p, ...args) {
  return origPromReadlink.call(this, p, ...args).catch((e) => {
    if (e && e.code === "EINVAL") throw e;
    if (isBenign(e)) throw toEINVAL(p);
    throw e;
  });
};

module.exports = { patched: true };
