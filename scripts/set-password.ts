import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { hashPassword } from "../src/lib/auth/password";

async function main() {
  const [email, password] = process.argv.slice(2);

  if (!email || !password) {
    console.error("Usage: npm run auth:set-password -- <email> <password>");
    process.exitCode = 1;
    return;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      console.error(`No user found with email ${email}. Run the seed first.`);
      process.exitCode = 1;
      return;
    }

    const passwordHash = hashPassword(password);
    await prisma.user.update({ where: { email }, data: { passwordHash } });

    console.log(`Password set for ${email}.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
