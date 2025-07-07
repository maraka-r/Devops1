// Script pour promouvoir un utilisateur en admin
// Usage: npx tsx scripts/make-admin.ts <email>

import prisma from '../src/lib/db';

async function makeAdmin(email: string) {
  try {
    console.log(`Promotion de l'utilisateur ${email} en admin...`);
    
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      }
    });
    
    console.log('✅ Utilisateur promu en admin:', updatedUser);
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2];
if (!email) {
  console.error('❌ Usage: npx tsx scripts/make-admin.ts <email>');
  process.exit(1);
}

makeAdmin(email);
