const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Handle cleanup on app termination
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
