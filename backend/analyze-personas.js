import prisma from './src/utils/prisma.js';
async function main() {
    const aiUsers = await prisma.user.findMany({
        where: { isAi: true },
        include: { persona: true }
    });
    console.log(`Analyzing ${aiUsers.length} AI Personas for Data Gaps:\n`);
    let totalEmptyBio = 0;
    let totalMissingPersona = 0;
    let totalEmptyInterests = 0;
    let totalMalformedInterests = 0;
    for (const u of aiUsers) {
        let issues = [];
        if (!u.bio || u.bio.trim() === '') {
            totalEmptyBio++;
            issues.push('EMPTY BIO');
        }
        if (!u.persona) {
            totalMissingPersona++;
            issues.push('MISSING PERSONA RECORD');
        }
        else {
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
    }
    console.log('\n==============================');
    console.log('📊 DATA GAP SUMMARY');
    console.log('==============================');
    console.log(`Total AI Users:      ${aiUsers.length}`);
    console.log(`Empty Bios:          ${totalEmptyBio}`);
    console.log(`Missing Persona:     ${totalMissingPersona}`);
    console.log(`Empty Interests:     ${totalEmptyInterests}`);
    console.log(`Malformed Interests: ${totalMalformedInterests}`);
    console.log('==============================');
}
main().catch(console.error);
//# sourceMappingURL=analyze-personas.js.map