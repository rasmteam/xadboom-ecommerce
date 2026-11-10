// One-off: writes the profile-page content from profiles.ts into designers that already exist.
import { getPrisma } from "../src/index";
import { profiles } from "./profiles";

async function main() {
  const prisma = getPrisma();
  for (const [slug, data] of Object.entries(profiles)) {
    const r = await prisma.designer.updateMany({ where: { slug }, data });
    console.log(slug, r.count);
  }
  process.exit(0);
}
main();
