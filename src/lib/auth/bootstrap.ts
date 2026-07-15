import { UserRole } from "@prisma/client";

import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";

export async function ensureDefaultUsers() {
  const userCount = await prisma.user.count();
  if (userCount > 0) return;

  await prisma.user.createMany({
    data: [
      {
        name: "User 1",
        email: "user1@private-macro-desk.local",
        passwordHash: hashPassword("user1"),
        role: UserRole.OWNER,
      },
      {
        name: "User 2",
        email: "user2@private-macro-desk.local",
        passwordHash: hashPassword("user2"),
        role: UserRole.MEMBER,
      },
    ],
  });

  console.log("[Bootstrap] No users found — created default accounts user1/user1 (owner) and user2/user2 (member).");
}
