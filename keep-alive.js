const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function keepAlive() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log(`[${new Date().toLocaleTimeString()}] ✅ Neon réveillé`);
  } catch (e) {
    console.error(`[${new Date().toLocaleTimeString()}] ❌ ${e.message}`);
  }
}

keepAlive();
setInterval(keepAlive, 4 * 60 * 1000); // toutes les 4 minutes