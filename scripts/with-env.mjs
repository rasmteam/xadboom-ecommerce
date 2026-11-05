// Runs a command with the variables from the root .env loaded (Node 22+): node scripts/with-env.mjs <command...>
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envFile = path.join(root, ".env");
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

const [cmd, ...args] = process.argv.slice(2);
const child = spawn(cmd, args, { cwd: root, stdio: "inherit", shell: true, env: process.env });
child.on("exit", (code) => process.exit(code ?? 0));
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => child.kill(sig));
