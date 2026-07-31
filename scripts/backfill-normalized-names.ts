/**
 * Re-normalises every stored normalised column with the current
 * normalizeArabic implementation.
 *
 * normalizeArabic used to strip the definite article BEFORE normalising hamza
 * forms, so a value written with alef wasla ("ٱلـ") kept its article at write
 * time while a search term for the same word loses it at query time — the row
 * became unreachable. The ordering was fixed, but rows written under the old
 * order still hold the old value, so they need one pass to catch up.
 *
 * Safe to run repeatedly: normalizeArabic is now idempotent, so rows that
 * already match are skipped and a second run reports zero updates.
 *
 * Dry run (default, writes nothing):  npx tsx scripts/backfill-normalized-names.ts
 * Apply:                              npx tsx scripts/backfill-normalized-names.ts --apply
 */
import 'dotenv/config';
import { prisma } from '../src/lib/client.js';
import { normalizeArabic } from '../src/utils/normalizeArabic.js';

const APPLY = process.argv.includes('--apply');
const BATCH = 500;

type Drift = { id: string; from: string; to: string; label: string };

async function backfillTags(): Promise<Drift[]> {
    const drift: Drift[] = [];
    const tags = await prisma.tag.findMany({
        select: { id: true, normalizedName: true },
    });

    for (const tag of tags) {
        const next = normalizeArabic(tag.normalizedName);
        if (next === tag.normalizedName) continue;

        // normalizedName is unique — if the corrected value already exists the
        // two tags are duplicates and merging them is a data decision, not a
        // mechanical rename, so report instead of guessing.
        const clash = await prisma.tag.findUnique({
            where: { normalizedName: next },
            select: { id: true },
        });
        if (clash && clash.id !== tag.id) {
            console.warn(
                `  ! tag ${tag.id} "${tag.normalizedName}" -> "${next}" collides with tag ${clash.id}; skipped (merge manually)`,
            );
            continue;
        }

        drift.push({ id: tag.id, from: tag.normalizedName, to: next, label: 'tag' });
        if (APPLY) {
            await prisma.tag.update({
                where: { id: tag.id },
                data: { normalizedName: next },
            });
        }
    }
    return drift;
}

async function backfillTitles(
    model: 'post' | 'question',
): Promise<Drift[]> {
    const drift: Drift[] = [];
    let cursor: string | null = null;

    for (;;) {
        const rows: { id: string; title: string; titleNormalized: string }[] =
            await (prisma[model] as any).findMany({
                select: { id: true, title: true, titleNormalized: true },
                orderBy: { id: 'asc' },
                take: BATCH,
                ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
            });

        if (rows.length === 0) break;
        cursor = rows[rows.length - 1].id;

        for (const row of rows) {
            // Re-derive from the source title, not from the stored value: the
            // stored one may have lost characters under the old ordering.
            const next = normalizeArabic(row.title);
            if (next === row.titleNormalized) continue;

            drift.push({
                id: row.id,
                from: row.titleNormalized,
                to: next,
                label: model,
            });
            if (APPLY) {
                await (prisma[model] as any).update({
                    where: { id: row.id },
                    data: { titleNormalized: next },
                });
            }
        }

        if (rows.length < BATCH) break;
    }
    return drift;
}

async function main() {
    console.log(APPLY ? 'APPLY mode — writing changes\n' : 'DRY RUN — pass --apply to write\n');

    const tagDrift = await backfillTags();
    console.log(`tags:      ${tagDrift.length} row(s) drifted`);

    const postDrift = await backfillTitles('post');
    console.log(`posts:     ${postDrift.length} row(s) drifted`);

    const questionDrift = await backfillTitles('question');
    console.log(`questions: ${questionDrift.length} row(s) drifted`);

    const all = [...tagDrift, ...postDrift, ...questionDrift];
    if (all.length) {
        console.log('\nfirst 20 changes:');
        for (const d of all.slice(0, 20)) {
            console.log(`  [${d.label}] ${d.id}\n      "${d.from}"\n   -> "${d.to}"`);
        }
        if (!APPLY) console.log('\nnothing written — re-run with --apply');
    } else {
        console.log('\nno drift: every stored value already matches the current normaliser');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
