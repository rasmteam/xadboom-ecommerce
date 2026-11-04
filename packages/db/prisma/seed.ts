import { getPrisma } from "../src/index";

const prisma = getPrisma();

async function main() {
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, currencyMode: "USD" },
  });
  console.log("seeded: settings");
}

main().finally(() => prisma.$disconnect());
