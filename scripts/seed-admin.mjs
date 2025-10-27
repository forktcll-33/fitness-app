// scripts/seed-admin.mjs
import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const email = "forktcll@gmail.com";   // كما طلبت
const plain = "Admin1234";            // كما طلبت
const hash = bcrypt.hashSync(plain, 10);

const user = await prisma.user.upsert({
  where: { email },
  update: {
    role: "ADMIN",
    isSubscribed: true,
    passwordHash: hash,   // <-- هنا
  },
  create: {
    email,
    name: "Admin",
    role: "ADMIN",
    isSubscribed: true,
    passwordHash: hash,   // <-- وهنا
  },
});

console.log("Seeded admin:", user.email);
await prisma.$disconnect();