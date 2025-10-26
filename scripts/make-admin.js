// scripts/make-admin.js
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

const email = process.argv[2];
if (!email) {
  console.error('استخدام: node scripts/make-admin.js you@example.com');
  process.exit(1);
}

(async () => {
  try {
    // حاول نلقى المستخدم
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      await prisma.user.update({
        where: { email },
        data: { role: 'admin' },
      });
      console.log(`✅ تم ترقية ${email} إلى أدمن`);
    } else {
      // لو ما موجود، ننشئ مستخدم مؤقت بكلمة سر عشوائية (تغييرها لاحقًا ضروري)
      const tempPass = crypto.randomBytes(6).toString('hex'); // مثال: 12 حرف
      // ملاحظة: هنا نخزّن hash أو plain؟ لأن عندنا register يستخدم bcrypt لحساب hash.
      // لنبقي الأمور بسيطة: نستخدم bcrypt لحوسبة الهاش قبل الإنشاء.
      const bcrypt = require('bcrypt');
      const passwordHash = await bcrypt.hash(tempPass, 10);

      const user = await prisma.user.create({
        data: {
          name: 'Admin',
          email,
          passwordHash,
          role: 'admin',
          isSubscribed: false,
        },
      });
      console.log(`✅ أنشئ حساب أدمن جديد: ${email}`);
      console.log(`   كلمة المرور المؤقتة: ${tempPass}`);
      console.log('   رجاء غيّر كلمة المرور فور الدخول من صفحة الحساب.');
    }
  } catch (e) {
    console.error('خطأ:', e);
  } finally {
    await prisma.$disconnect();
  }
})();