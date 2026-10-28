import { PrismaClient } from 'file:///C:/Users/hp/.gemini/antigravity/scratch/akfa/apps/api/node_modules/@prisma/client/default.js';

const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:12345678@localhost:5432/akfa_workshop_dev?schema=public';

async function main() {
  console.log(`Connecting to database to purge workers and history...`);
  const prisma = new PrismaClient({
    datasources: { db: { url: dbUrl } },
  });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const att = await tx.attendance.deleteMany({});
      const pay = await tx.payment.deleteMany({});
      const workers = await tx.worker.deleteMany({});
      return {
        attendances: att.count,
        payments: pay.count,
        workers: workers.count,
      };
    });

    console.log('✓ Purge Results:', result);

    const owners = await prisma.owner.findMany({
      select: {
        id: true,
        username: true,
        fullName: true,
        workshopName: true,
        language: true,
      },
    });

    console.log('✓ Preserved Owner Account(s):', owners);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Purge error:', err);
  process.exit(1);
});
