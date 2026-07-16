#!/usr/bin/env node
// CommonJS on purpose (not TypeScript, no tsx): this ships inside the Docker runtime
// image, which only has compiled output + node_modules, not the raw src/ tree or a TS
// runner. Mirrors src/lib/auth/password.ts's scrypt hashing exactly.
"use strict";

const { randomBytes, scryptSync } = require("node:crypto");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

const SCRYPT_KEY_LENGTH = 64;
const SALT_LENGTH = 16;

function hashPassword(password) {
  const salt = randomBytes(SALT_LENGTH);
  const derivedKey = scryptSync(password, salt, SCRYPT_KEY_LENGTH);
  return `scrypt:${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

async function main() {
  const [email, password] = process.argv.slice(2);

  if (!email || !password) {
    console.error("Usage: node docker-set-password.cjs <email> <new-password>");
    process.exitCode = 1;
    return;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.error(`No user found with email ${email}.`);
      process.exitCode = 1;
      return;
    }

    await prisma.user.update({
      where: { email },
      data: { passwordHash: hashPassword(password) },
    });

    console.log(`Password updated for ${email}.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
