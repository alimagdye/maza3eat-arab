import { prisma } from '../src/lib/client.ts';

async function main() {
    await prisma.tier.createMany({
        data: [
            { name: 'مبتدئ', badgeColor: '#bbbbbb' },
            { name: 'متوسط', badgeColor: '#4caf50' },
            { name: 'محترف', badgeColor: '#ff9800' },
        ],
        skipDuplicates: true,
    });

    console.log('(*-*) Tiers seeded!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
