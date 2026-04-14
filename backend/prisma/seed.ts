import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    await prisma.tier.createMany({
        data: [
            { name: 'Beginner', badgeColor: '#bbbbbb' },
            { name: 'Intermediate', badgeColor: '#4caf50' },
            { name: 'Pro', badgeColor: '#ff9800' },
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
