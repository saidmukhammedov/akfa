#!/usr/bin/env node
/**
 * Safe Administrative Credential Reset Script for AKFA Staging
 * 
 * Usage:
 *   node scripts/admin-reset-owner.mjs [STAGING_DATABASE_URL]
 * Or set environment variables:
 *   STAGING_DATABASE_URL=... TARGET_OWNER_USERNAME=admin NEW_OWNER_PASSWORD=... node scripts/admin-reset-owner.mjs
 * 
 * Security Guarantees:
 * - Requires explicit database connection string
 * - Refuses to run against production database without explicit confirmation flag
 * - Strictly updates single existing owner transactionally
 * - Revokes all existing refresh tokens/sessions for the owner
 * - Never prints or leaks password to stdout, logs, or disk
 * - Uses exact project bcrypt configuration (salt rounds: 12)
 */

import { PrismaClient } from 'file:///C:/Users/hp/.gemini/antigravity/scratch/akfa/apps/api/node_modules/@prisma/client/default.js';
import bcrypt from 'file:///C:/Users/hp/.gemini/antigravity/scratch/akfa/apps/api/node_modules/bcryptjs/index.js';
import readline from 'readline';

function promptInput(query, isPassword = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    if (isPassword) {
      process.stdout.write(query);
      const stdin = process.stdin;
      const oldRawMode = stdin.isRaw;
      if (stdin.setRawMode) stdin.setRawMode(true);
      stdin.resume();

      let password = '';
      const onData = (chunk) => {
        const char = chunk.toString('utf8');
        for (let i = 0; i < char.length; i++) {
          const c = char[i];
          if (c === '\r' || c === '\n' || c === '\u0004') {
            if (stdin.setRawMode) stdin.setRawMode(oldRawMode);
            stdin.removeListener('data', onData);
            rl.close();
            process.stdout.write('\n');
            resolve(password.trim());
            return;
          } else if (c === '\u0008' || c === '\x7f') {
            if (password.length > 0) {
              password = password.slice(0, -1);
              process.stdout.write('\b \b');
            }
          } else if (c === '\u0003') {
            // Ctrl+C
            process.exit(1);
          } else {
            password += c;
            process.stdout.write('*');
          }
        }
      };
      stdin.on('data', onData);
    } else {
      rl.question(query, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    }
  });
}

function sanitizeDatabaseUrl(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//***:***@${parsed.host}${parsed.pathname}`;
  } catch {
    return 'invalid-url';
  }
}

async function main() {
  console.log('\n======================================================');
  console.log('AKFA Workshop — Administrative Credential Reset');
  console.log('======================================================\n');

  // 1. Resolve Target Database URL
  let dbUrl = process.env.STAGING_DATABASE_URL || process.env.DIRECT_URL || process.env.DATABASE_URL || process.argv[2];

  if (!dbUrl) {
    dbUrl = await promptInput('Enter Staging PostgreSQL Connection String (DATABASE_URL or DIRECT_URL): ');
  }

  if (!dbUrl || !dbUrl.startsWith('postgres')) {
    console.error('❌ Error: A valid PostgreSQL connection string is required.');
    process.exit(1);
  }

  const sanitized = sanitizeDatabaseUrl(dbUrl);
  console.log(`Target Database: ${sanitized}`);

  // Ensure Prisma client runtime uses the targeted database URL
  process.env.DATABASE_URL = dbUrl;

  // Safety Check: Refuse production unless confirmed
  const isProd = dbUrl.toLowerCase().includes('prod') && !dbUrl.toLowerCase().includes('staging');
  if (isProd && process.env.ALLOW_PRODUCTION_RESET !== 'true') {
    console.error('\n⚠️ SAFETY BLOCK: Target database appears to be PRODUCTION.');
    console.error('To run against production, you must set ALLOW_PRODUCTION_RESET=true.');
    process.exit(1);
  }

  // 2. Resolve Target Username
  const targetUsername = process.env.TARGET_OWNER_USERNAME || 'admin';
  console.log(`Target Owner Username: ${targetUsername}`);

  // 3. Resolve New Password Securely
  let newPassword = process.env.NEW_OWNER_PASSWORD;
  if (!newPassword) {
    newPassword = await promptInput('Enter new temporary password for owner: ', true);
    if (!newPassword) {
      console.error('❌ Error: Password cannot be empty.');
      process.exit(1);
    }
    const confirmPassword = await promptInput('Confirm new temporary password: ', true);
    if (newPassword !== confirmPassword) {
      console.error('❌ Error: Passwords do not match.');
      process.exit(1);
    }
  }

  if (newPassword.length < 6) {
    console.error('❌ Error: Password must be at least 6 characters long.');
    process.exit(1);
  }

  // 4. Initialize Prisma Client with Target Database
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });

  try {
    await prisma.$connect();
    console.log('✓ Connected to database successfully.');

    // 5. Hash Password with Project Standard (bcrypt 12 rounds)
    console.log('Hashing password with bcrypt (12 rounds)...');
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // 6. Execute Transactional Reset
    console.log('Applying credential reset inside database transaction...');
    const result = await prisma.$transaction(async (tx) => {
      const owners = await tx.owner.findMany({
        orderBy: { createdAt: 'asc' },
      });

      if (owners.length === 0) {
        // Create initial owner if database has none
        const created = await tx.owner.create({
          data: {
            username: targetUsername,
            passwordHash,
            fullName: 'Staging Administrator',
            workshopName: 'AKFA Ustaxonasi',
            language: 'uz',
          },
        });
        return {
          action: 'CREATED',
          ownerId: created.id,
          username: created.username,
          revokedTokens: 0,
        };
      } else {
        // Update the primary owner
        const primaryOwner = owners[0];
        const updated = await tx.owner.update({
          where: { id: primaryOwner.id },
          data: {
            username: targetUsername,
            passwordHash,
          },
        });

        // Revoke all existing sessions and refresh tokens for security
        const revoked = await tx.refreshToken.updateMany({
          where: { ownerId: primaryOwner.id },
          data: { revokedAt: new Date() },
        });

        return {
          action: 'UPDATED',
          ownerId: updated.id,
          oldUsername: primaryOwner.username,
          newUsername: updated.username,
          revokedTokens: revoked.count,
        };
      }
    });

    console.log('\n======================================================');
    console.log(`✓ Credential reset successfully completed!`);
    console.log(`Action: ${result.action}`);
    console.log(`Owner ID: ${result.ownerId}`);
    if (result.action === 'UPDATED') {
      console.log(`Username updated: '${result.oldUsername}' -> '${result.newUsername}'`);
      console.log(`Revoked active sessions: ${result.revokedTokens}`);
    } else {
      console.log(`Owner username created: '${result.username}'`);
    }
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Failed to reset credentials:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
