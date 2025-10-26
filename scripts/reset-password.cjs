// scripts/reset-password.cjs
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

const email = process.argv[2];
const newPass = process.argv[3];

if (!email || !newPass) {
  console.error('استخدم: node scripts/reset-password.cjs EMAIL NEW_PASSWORD');
  process.exit(1);
}

(async () => {
  const passwordHash = await bcrypt.hash(newPass, 10);
  const user = await prisma.user.update({
    where: { email },
    data: { passwordHash },
    select: { id: true, email: true }
  });
  console.log(`✅ تم تحديث كلمة المرور لـ ${user.email}`);
  await prisma.$disconnect();
})();