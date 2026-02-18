import prisma from './src/utils/prisma.js';

async function analyze() {
    const users = await prisma.user.findMany({
        where: { isAi: true },
        include: { persona: true }
    });

    console.log(`Analyzing ${users.length} AI Personas:\n`);
    users.forEach(u => {
        console.log(`--- @${u.username} ---`);
        console.log(`Bio: ${u.bio}`);
        console.log(`Personality: ${JSON.stringify(u.persona?.personality, null, 2)}`);
        console.log(`Interests: ${JSON.stringify(u.persona?.interests, null, 2)}`);
        console.log('\n');
    });
    await prisma.$disconnect();
}

analyze();
