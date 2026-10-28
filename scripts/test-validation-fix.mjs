import { createApp } from '../apps/api/dist/app.js';
import { prisma } from '../apps/api/dist/services/prisma.js';
import { generateAccessToken } from '../apps/api/dist/services/auth.service.js';

async function main() {
  const owner = await prisma.owner.findFirst();
  if (!owner) {
    console.error('No owner found');
    process.exit(1);
  }
  const token = generateAccessToken(owner);
  const app = createApp();
  const server = app.listen(4005, async () => {
    try {
      console.log('Sending test request with user input: Fund nk8c, phone: 9999999, rate: 200000...');
      const res = await fetch('http://localhost:4005/api/workers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: 'Fund nk8c',
          phone: '9999999',
          role: 'usta',
          dailyRate: 200000,
        }),
      });

      const data = await res.json();
      console.log('HTTP Status:', res.status);
      console.log('API Response:', JSON.stringify(data, null, 2));

      if (res.status === 201 && data.success) {
        console.log('✓ SUCCESS: Worker was created successfully with 7-digit phone!');
        await prisma.worker.delete({ where: { id: data.data.id } });
        console.log('✓ Cleaned up test worker.');
      } else {
        throw new Error(`Failed to create worker: ${JSON.stringify(data)}`);
      }

      // Now test that invalid input returns the exact descriptive Uzbek message
      console.log('\nTesting invalid phone input: "123"...');
      const badRes = await fetch('http://localhost:4005/api/workers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: 'Fund nk8c',
          phone: '123',
          role: 'usta',
          dailyRate: 200000,
        }),
      });

      const badData = await badRes.json();
      console.log('HTTP Status:', badRes.status);
      console.log('Error message returned:', badData.error);
      if (badRes.status === 400 && badData.error.includes("Telefon raqami noto'g'ri")) {
        console.log('✓ SUCCESS: Descriptive localized Uzbek message returned instead of generic "Validation failed"!');
      } else {
        throw new Error(`Expected descriptive message, got: ${badData.error}`);
      }

    } finally {
      server.close();
      await prisma.$disconnect();
    }
  });
}

main().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
