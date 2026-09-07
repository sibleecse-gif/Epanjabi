const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

async function main() {
  const prisma = new PrismaClient();
  const count = await prisma.product.count();
  await prisma.$disconnect();

  if (count === 0) {
    console.log('🌱 Empty database — running seed...');
    execSync('node dist/seed.js', { stdio: 'inherit' });
  } else {
    console.log(`✅ Database already has ${count} products — skipping seed.`);
  }
}

main().catch((e) => {
  console.error('❌ Failed during startup check:', e);
  process.exit(1);
});