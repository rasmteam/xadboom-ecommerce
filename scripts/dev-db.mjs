// Local development database without Docker: a real PostgreSQL 16 running as a normal process.
//   pnpm dev:db            start (keeps running; Ctrl+C to stop). Data lives in .local/pgdata
//   pnpm dev:db --reset    wipe the data directory first
// Connection string: postgresql://postgres:postgres@localhost:54329/xadboom?schema=public
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import EmbeddedPostgres from "embedded-postgres";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const databaseDir = path.join(root, ".local", "pgdata");
const port = Number(process.env.DEV_DB_PORT ?? 54329);
const DB = "xadboom";

if (process.argv.includes("--reset")) fs.rmSync(databaseDir, { recursive: true, force: true });
const fresh = !fs.existsSync(path.join(databaseDir, "PG_VERSION"));

const pg = new EmbeddedPostgres({
  databaseDir,
  user: "postgres",
  password: "postgres",
  port,
  persistent: true,
  onLog: () => {},
  onError: (e) => console.error(String(e)),
});

if (fresh) await pg.initialise();
await pg.start();
if (fresh) await pg.createDatabase(DB);

console.log(`PostgreSQL ready on port ${port}`);
console.log(`DATABASE_URL=postgresql://postgres:postgres@localhost:${port}/${DB}?schema=public`);

const stop = async () => {
  await pg.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
setInterval(() => {}, 1 << 30); // keep the process alive
