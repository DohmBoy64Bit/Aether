import prisma from './src/utils/prisma.js';

async function makeAdmin() {
    try {
        const user = await prisma.user.update({
            where: { username: 'DohmBoy64' },
            data: { isAdmin: true }
        });
        console.log(`\n✅ Success! User @${user.username} is now an Admin.\n`);
    } catch (error) {
        console.error('\n❌ Failed to update user. Are you sure "DohmBoy64" exists in the database?');
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

makeAdmin();
