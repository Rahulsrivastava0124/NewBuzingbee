// Cross-platform pre-dev cleanup (works in Windows cmd/PowerShell and Unix shells):
// 1. free port 3000 if an old dev server still holds it
// 2. clear the .next cache
// 3. regenerate sitemap / SEO files
import { execSync } from "node:child_process";
import { rmSync } from "node:fs";

const PORT = 3000;

function run(cmd) {
  try {
    return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] }).toString();
  } catch {
    return "";
  }
}

function pidsOnPort(port) {
  if (process.platform === "win32") {
    // lines like: TCP  0.0.0.0:3000  0.0.0.0:0  LISTENING  12345
    return run("netstat -ano -p tcp")
      .split(/\r?\n/)
      .filter((l) => /LISTENING/i.test(l) && new RegExp(`:${port}\\s`).test(l))
      .map((l) => l.trim().split(/\s+/).pop());
  }
  return run(`lsof -ti tcp:${port}`).split(/\s+/);
}

const pids = [...new Set(pidsOnPort(PORT))].filter(
  (p) => p && /^\d+$/.test(p) && p !== "0" && Number(p) !== process.pid
);

for (const pid of pids) {
  if (process.platform === "win32") run(`taskkill /PID ${pid} /T /F`);
  else run(`kill -9 ${pid}`);
  console.log(`[predev] stopped process ${pid} on port ${PORT}`);
}

if (pids.length) await new Promise((r) => setTimeout(r, 1000));

rmSync(".next", { recursive: true, force: true });

execSync("npm run seo:generate", { stdio: "inherit" });
