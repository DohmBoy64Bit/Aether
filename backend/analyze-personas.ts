import prisma from './src/utils/prisma.js';

async function analyze() {
    const users = await prisma.user.findMany({
        where: { isAi: true },
        include: { persona: true }
    });

    console.log(`Analyzing ${users.length} AI Personas for Data Gaps:\n`);

    let totalEmptyBio = 0;
    let totalMissingPersona = 0;
    let totalMalformedInterests = 0;
    let totalEmptyInterests = 0;

    users.forEach(u => {
        let issues: string[] = [];

        if (!u.bio || u.bio.trim() === '') {
            totalEmptyBio++;
            issues.push('EMPTY BIO');
        }

        if (!u.persona) {
            totalMissingPersona++;
            issues.push('MISSING PERSONA RECORD');
        } else {
            const interests = u.persona.interests;
            const interestList = Array.isArray(interests) ? interests : [];

            if (interestList.length === 0) {
                totalEmptyInterests++;
                issues.push('EMPTY INTERESTS LIST');
            }

            // Check for [object Object] leaks or nested objects in string fields
            const interestStr = JSON.stringify(interests);
            if (interestStr.includes('[object Object]')) {
                totalMalformedInterests++;
                issues.push('MALFORMED INTERESTS ([object Object] detected)');
            }
        }

        if (issues.length > 0) {
            console.log(`❌ @${u.username}: ${issues.join(', ')}`);
        }
    });

    console.log('\n' + '='.repeat(30));
    console.log('📊 DATA GAP SUMMARY');
    console.log('='.repeat(30));
    console.log(`Total AI Users:      ${users.length}`);
    console.log(`Empty Bios:          ${totalEmptyBio}`);
    console.log(`Missing Persona:     ${totalMissingPersona}`);
    console.log(`Empty Interests:     ${totalEmptyInterests}`);
    console.log(`Malformed Interests: ${totalMalformedInterests}`);
    console.log('='.repeat(30));

    await prisma.$disconnect();
}

analyze();
