/**
 * Removes everything created by scripts/seed-qa-data.ts.
 * Deleting the two seed users cascades to their posts, questions, comments,
 * replies, answers, contact requests and reports.
 *
 * Run:  npx tsx scripts/unseed-qa-data.ts
 */
import 'dotenv/config';
import { prisma } from '../src/lib/client.js';

async function main() {
    const users = await prisma.user.findMany({
        where: { email: { in: ['seed-qa-sara@maza3eat.local', 'seed-qa-omar@maza3eat.local'] } },
        select: { id: true, email: true },
    });

    // Ads are owned by the real admin, so they are removed by title marker.
    const ads = await prisma.ad.findMany({
        where: { title: { startsWith: '[SEED-QA]' } },
        select: { id: true },
    });
    if (ads.length) {
        await prisma.homeAd.deleteMany({ where: { adId: { in: ads.map((a) => a.id) } } });
        await prisma.ad.deleteMany({ where: { id: { in: ads.map((a) => a.id) } } });
    }

    // Anything still marked but authored by a non-seed user.
    await prisma.post.deleteMany({ where: { title: { startsWith: '[SEED-QA]' } } });
    await prisma.question.deleteMany({ where: { title: { startsWith: '[SEED-QA]' } } });

    if (users.length) {
        await prisma.user.deleteMany({ where: { id: { in: users.map((u) => u.id) } } });
    }

    // Orphan tags created only by the seed.
    for (const name of ['desert', 'redsea']) {
        const tag = await prisma.tag.findUnique({
            where: { normalizedName: name },
            include: { _count: { select: { posts: true, questions: true } } },
        });
        if (tag && tag._count.posts === 0 && tag._count.questions === 0) {
            await prisma.tag.delete({ where: { id: tag.id } });
        }
    }

    console.log('removed seed users:', users.map((u) => u.email).join(', ') || 'none');
    console.log('current totals:', {
        users: await prisma.user.count(),
        posts: await prisma.post.count(),
        questions: await prisma.question.count(),
        ads: await prisma.ad.count(),
        homeAds: await prisma.homeAd.count(),
        reports: await prisma.report.count(),
        contactRequests: await prisma.contactRequest.count(),
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
