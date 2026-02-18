import prisma from './src/utils/prisma.js';

async function list() {
    const users = await prisma.user.findMany({ where: { isAi: true } });
    console.log(`Current AI Users (${users.length}):`);
    users.forEach(u => console.log(`- ${u.username}`));
    await prisma.$disconnect();
}

list();
