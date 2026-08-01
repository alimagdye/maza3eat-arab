/**
 * Full QA seed — exercises every surface of the app.
 *
 * Creates: one user per tier (plus a banned user and a moderator), posts and
 * questions in every ContentStatus, featured/community home slots, nested
 * comment and answer threads with likes and votes, one notification of every
 * NotificationType (read + unread + an aggregated one), announcements, ads in
 * every state and home position, contact requests in every status and reports
 * of every target type.
 *
 * The script is destructive ONLY for its own data: it removes anything marked
 * [SEED-QA] first, then recreates it, so it is safe to re-run.
 *
 * Run:     npx tsx scripts/seed-qa-data.ts
 * Remove:  npx tsx scripts/unseed-qa-data.ts
 */
import 'dotenv/config';
import { prisma } from '../src/lib/client.js';
import { normalizeArabic } from '../src/utils/normalizeArabic.js';

const MARK = '[SEED-QA]';
const SEED_EMAIL_PREFIX = 'seed-qa-';

const img = (seed: string, w = 1200, h = 800) =>
    `https://picsum.photos/seed/${seed}/${w}/${h}`;

/** Marker-scoped cleanup so re-runs stay idempotent. */
async function wipe() {
    const seedUsers = await prisma.user.findMany({
        where: { email: { startsWith: SEED_EMAIL_PREFIX } },
        select: { id: true },
    });
    const ids = seedUsers.map((u) => u.id);

    const ads = await prisma.ad.findMany({
        where: { title: { startsWith: MARK } },
        select: { id: true },
    });
    if (ads.length) {
        await prisma.homeAd.deleteMany({ where: { adId: { in: ads.map((a) => a.id) } } });
        await prisma.ad.deleteMany({ where: { id: { in: ads.map((a) => a.id) } } });
    }

    // Announcements are global (no recipient), so they are matched by message.
    const announcements = await prisma.adminNotification.findMany({
        where: { message: { startsWith: MARK } },
        select: { notificationId: true },
    });
    if (announcements.length) {
        await prisma.notification.deleteMany({
            where: { id: { in: announcements.map((a) => a.notificationId) } },
        });
    }

    await prisma.post.deleteMany({ where: { title: { startsWith: MARK } } });
    await prisma.question.deleteMany({ where: { title: { startsWith: MARK } } });

    if (ids.length) {
        // Cascades to their posts, questions, comments, replies, answers,
        // likes, contact requests, reports, bans and notifications.
        await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }
}

async function main() {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!admin) throw new Error('No ADMIN user found — sign in once first.');

    console.log('clearing previous seed data…');
    await wipe();

    const tiers = await prisma.tier.findMany({ orderBy: { id: 'asc' } });
    const memberTiers = tiers.filter((t) => !t.isSystem);
    const modTier = tiers.find((t) => t.isSystem) ?? tiers[0];

    // ── users: one per member tier, plus a moderator and a banned member ─────
    const memberSpecs = [
        { key: 'sara', name: 'Sara Khaled', avatar: 47 },
        { key: 'omar', name: 'Omar Fathy', avatar: 12 },
        { key: 'lina', name: 'Lina Haddad', avatar: 32 },
        { key: 'youssef', name: 'Youssef Nabil', avatar: 15 },
        { key: 'hala', name: 'Hala Mansour', avatar: 45 },
        { key: 'karim', name: 'Karim Adel', avatar: 68 },
    ];

    const members = [];
    for (const [i, spec] of memberSpecs.entries()) {
        const tier = memberTiers[i % memberTiers.length];
        members.push(
            await prisma.user.create({
                data: {
                    googleId: `${SEED_EMAIL_PREFIX}${spec.key}`,
                    name: `${MARK} ${spec.name}`,
                    email: `${SEED_EMAIL_PREFIX}${spec.key}@maza3eat.local`,
                    avatar: `https://i.pravatar.cc/150?img=${spec.avatar}`,
                    role: 'USER',
                    tierId: tier.id,
                },
            })
        );
    }
    const [sara, omar, lina, youssef, hala, karim] = members;

    const moderator = await prisma.user.create({
        data: {
            googleId: `${SEED_EMAIL_PREFIX}mod`,
            name: `${MARK} Nour Moderator`,
            email: `${SEED_EMAIL_PREFIX}mod@maza3eat.local`,
            avatar: 'https://i.pravatar.cc/150?img=5',
            role: 'MODERATOR',
            tierId: modTier.id,
        },
    });

    const bannedUser = await prisma.user.create({
        data: {
            googleId: `${SEED_EMAIL_PREFIX}banned`,
            name: `${MARK} Banned Member`,
            email: `${SEED_EMAIL_PREFIX}banned@maza3eat.local`,
            avatar: 'https://i.pravatar.cc/150?img=60',
            role: 'USER',
            tierId: memberTiers[0].id,
            ban: {
                create: {
                    reason: `${MARK} Repeated spam in the community feed`,
                    bannedById: admin.id,
                },
            },
        },
    });

    // ── tags ─────────────────────────────────────────────────────────────────
    const tagNames = [
        'egypt', 'morocco', 'saudi', 'jordan', 'budgettravel',
        'desert', 'redsea', 'roadtrip', 'مصر', 'شواطئ',
    ];
    const tags = new Map<string, { id: string }>();
    for (const name of tagNames) {
        tags.set(
            name,
            await prisma.tag.upsert({
                where: { normalizedName: normalizeArabic(name) },
                update: {},
                create: { normalizedName: normalizeArabic(name) },
            })
        );
    }

    // ── posts: every status, varied image counts, EN + AR titles ─────────────
    const postSpecs = [
        { t: 'Diving the Red Sea on a shoestring', s: 'APPROVED', tags: ['egypt', 'redsea', 'budgettravel'], imgs: 4, author: sara, likes: 42, ar: false },
        { t: 'Three days across the Sahara', s: 'APPROVED', tags: ['morocco', 'desert'], imgs: 3, author: omar, likes: 31, ar: false },
        { t: 'رحلة إلى أسوان في الشتاء', s: 'APPROVED', tags: ['مصر', 'egypt'], imgs: 2, author: lina, likes: 27, ar: true },
        { t: 'AlUla after dark: a stargazing guide', s: 'APPROVED', tags: ['saudi', 'desert'], imgs: 5, author: youssef, likes: 55, ar: false },
        { t: 'Petra in one day — is it enough?', s: 'APPROVED', tags: ['jordan', 'roadtrip'], imgs: 1, author: hala, likes: 18, ar: false },
        { t: 'أجمل شواطئ البحر الأحمر', s: 'APPROVED', tags: ['شواطئ', 'redsea'], imgs: 3, author: karim, likes: 39, ar: true },
        { t: 'Renting a car in Morocco: what nobody tells you', s: 'APPROVED', tags: ['morocco', 'roadtrip'], imgs: 2, author: sara, likes: 12, ar: false },
        { t: 'Budget breakdown: two weeks in Jordan', s: 'APPROVED', tags: ['jordan', 'budgettravel'], imgs: 2, author: omar, likes: 8, ar: false },
        { t: 'A post with no photos at all', s: 'APPROVED', tags: ['roadtrip'], imgs: 0, author: lina, likes: 3, ar: false },
        { t: 'PENDING — waiting for approval', s: 'PENDING', tags: ['morocco'], imgs: 2, author: youssef, likes: 0, ar: false },
        { t: 'PENDING — منشور بانتظار المراجعة', s: 'PENDING', tags: ['مصر'], imgs: 1, author: hala, likes: 0, ar: true },
        { t: 'PENDING — third in the moderation queue', s: 'PENDING', tags: ['desert'], imgs: 3, author: karim, likes: 0, ar: false },
        { t: 'REJECTED — advertising disguised as a trip report', s: 'REJECTED', tags: ['egypt'], imgs: 1, author: sara, likes: 0, ar: false },
    ] as const;

    const posts = [];
    for (const [i, spec] of postSpecs.entries()) {
        const body = spec.ar
            ? `<p>${MARK} محتوى تجريبي لاختبار العرض باللغة العربية.</p><p>فقرة ثانية بها تفاصيل الرحلة والتكلفة التقريبية.</p>`
            : `<p>${MARK} Seeded trip report used for manual testing.</p><p>A second paragraph so the reader view has real content to lay out, including costs, timings and a short packing list.</p>`;
        posts.push(
            await prisma.post.create({
                data: {
                    authorId: spec.author.id,
                    title: `${MARK} ${spec.t}`,
                    titleNormalized: normalizeArabic(`${MARK} ${spec.t}`),
                    content: body,
                    status: spec.s,
                    likesCount: spec.likes,
                    rejectionReason:
                        spec.s === 'REJECTED'
                            ? 'Promotional content — please remove the affiliate links and resubmit.'
                            : null,
                    images: {
                        create: Array.from({ length: spec.imgs }, (_, n) => ({
                            originalName: `seed-qa-post-${i}-${n}.jpg`,
                            imageUrl: img(`seedqa-post-${i}-${n}`),
                            publicId: `seed-qa/post-${i}-${n}`,
                            width: 1200,
                            height: 800,
                        })),
                    },
                    tags: {
                        create: spec.tags.map((name) => ({ tagId: tags.get(name)!.id, name })),
                    },
                },
            })
        );
    }

    const approvedPosts = posts.filter((p) => p.status === 'APPROVED');

    // Post likes (real rows so likedByMe works for the admin account too).
    for (const [i, post] of approvedPosts.entries()) {
        const likers = [admin, ...members].slice(0, (i % 4) + 2);
        for (const u of likers) {
            await prisma.postLike.create({ data: { postId: post.id, userId: u.id } });
        }
        await prisma.post.update({
            where: { id: post.id },
            data: { likesCount: likers.length },
        });
    }

    // ── home slots: COMMUNITY strip + ADMIN (featured) strip ─────────────────
    for (const scope of ['COMMUNITY', 'ADMIN'] as const) {
        const slice = scope === 'COMMUNITY' ? approvedPosts.slice(0, 4) : approvedPosts.slice(4, 8);
        for (const [i, post] of slice.entries()) {
            const position = i + 1;
            const taken = await prisma.homePost.findFirst({ where: { scope, position } });
            if (taken) await prisma.homePost.delete({ where: { id: taken.id } });
            await prisma.homePost.create({ data: { postId: post.id, scope, position } });
        }
    }

    // ── comments + nested replies + likes ────────────────────────────────────
    const commentTargets = approvedPosts.slice(0, 5);
    let firstComment: { id: string } | null = null;
    let firstReply: { id: string; path: string } | null = null;
    let firstNestedReply: { id: string } | null = null;

    for (const [i, post] of commentTargets.entries()) {
        const comment = await prisma.comment.create({
            data: {
                postId: post.id,
                authorId: members[(i + 1) % members.length].id,
                content: `${MARK} Great write-up — how much was the boat trip in the end?`,
                likesCount: 2,
            },
        });
        const secondComment = await prisma.comment.create({
            data: {
                postId: post.id,
                authorId: members[(i + 2) % members.length].id,
                content: `${MARK} تعليق باللغة العربية للتأكد من العرض من اليمين لليسار.`,
            },
        });

        await prisma.commentLike.createMany({
            data: [
                { commentId: comment.id, userId: admin.id },
                { commentId: comment.id, userId: members[0].id },
            ],
        });

        // root reply → nested reply → nested-nested reply (paths mirror the API)
        const reply = await prisma.reply.create({
            data: {
                commentId: comment.id,
                authorId: post.authorId,
                content: `${MARK} Around 40 USD per person, lunch included.`,
                depth: 0,
                path: `${comment.id}.1`,
                likesCount: 1,
            },
        });
        const nested = await prisma.reply.create({
            data: {
                commentId: comment.id,
                parentReplyId: reply.id,
                authorId: members[(i + 3) % members.length].id,
                content: `${MARK} Did that include the national park fee?`,
                depth: 1,
                path: `${comment.id}.1.1`,
            },
        });
        await prisma.reply.create({
            data: {
                commentId: comment.id,
                parentReplyId: nested.id,
                authorId: post.authorId,
                content: `${MARK} It did not — budget another 10 USD for that.`,
                depth: 2,
                path: `${comment.id}.1.1.1`,
            },
        });

        await prisma.replyLike.create({ data: { replyId: reply.id, userId: admin.id } });
        await prisma.comment.update({ where: { id: comment.id }, data: { repliesCount: 3 } });
        await prisma.post.update({
            where: { id: post.id },
            data: { commentsCount: 2 },
        });

        if (!firstComment) {
            firstComment = comment;
            firstReply = reply;
            firstNestedReply = nested;
        }
        void secondComment;
    }

    // ── questions: every status + answers, votes, nested answer replies ──────
    const questionSpecs = [
        { t: 'Best month to visit Marrakech?', s: 'APPROVED', tags: ['morocco'], ar: false },
        { t: 'ما أفضل وقت لزيارة العلا؟', s: 'APPROVED', tags: ['saudi'], ar: true },
        { t: 'Is the Cairo–Luxor sleeper train worth it?', s: 'APPROVED', tags: ['egypt', 'roadtrip'], ar: false },
        { t: 'Solo female travel in Jordan — safe?', s: 'APPROVED', tags: ['jordan'], ar: false },
        { t: 'Cheapest way from Dahab to Sharm?', s: 'APPROVED', tags: ['egypt', 'budgettravel'], ar: false },
        { t: 'Any diving certification schools on the Red Sea?', s: 'APPROVED', tags: ['redsea'], ar: false },
        { t: 'PENDING question awaiting review', s: 'PENDING', tags: ['egypt'], ar: false },
        { t: 'PENDING — سؤال بانتظار المراجعة', s: 'PENDING', tags: ['مصر'], ar: true },
        { t: 'REJECTED — duplicate of an existing question', s: 'REJECTED', tags: ['morocco'], ar: false },
    ] as const;

    const questions = [];
    for (const spec of questionSpecs) {
        questions.push(
            await prisma.question.create({
                data: {
                    authorId: members[questions.length % members.length].id,
                    title: `${MARK} ${spec.t}`,
                    titleNormalized: normalizeArabic(`${MARK} ${spec.t}`),
                    content: spec.ar
                        ? `<p>${MARK} نص السؤال التجريبي مع بعض التفاصيل الإضافية.</p>`
                        : `<p>${MARK} Seeded question body with a little extra context so the thread view is not empty.</p>`,
                    status: spec.s,
                    rejectionReason:
                        spec.s === 'REJECTED' ? 'Already answered in an existing thread.' : null,
                    tags: {
                        create: spec.tags.map((name) => ({ tagId: tags.get(name)!.id, name })),
                    },
                },
            })
        );
    }

    const approvedQuestions = questions.filter((q) => q.status === 'APPROVED');
    let firstAnswer: { id: string } | null = null;
    let firstAnswerReply: { id: string; path: string } | null = null;
    let firstNestedAnswerReply: { id: string } | null = null;

    for (const [i, question] of approvedQuestions.entries()) {
        const answerCount = (i % 3) + 1;
        for (let a = 0; a < answerCount; a++) {
            const answer = await prisma.answer.create({
                data: {
                    questionId: question.id,
                    authorId: members[(i + a + 1) % members.length].id,
                    content:
                        a === 0
                            ? `${MARK} March and October — mild weather and far fewer crowds.`
                            : `${MARK} Another perspective: go in the shoulder season and book two weeks ahead.`,
                    totalVoteValue: a === 0 ? 5 - i : 1,
                },
            });

            // votes (mixed up/down so the vote widget has real state)
            await prisma.answerVote.create({
                data: { answerId: answer.id, userId: admin.id, value: a === 0 ? 1 : -1 },
            });
            await prisma.answerVote.create({
                data: { answerId: answer.id, userId: members[0].id, value: 1 },
            });

            if (a === 0) {
                const reply = await prisma.answerReply.create({
                    data: {
                        answerId: answer.id,
                        authorId: question.authorId,
                        content: `${MARK} Agreed — August is unbearable.`,
                        depth: 0,
                        path: `${answer.id}.1`,
                        likesCount: 1,
                    },
                });
                const nested = await prisma.answerReply.create({
                    data: {
                        answerId: answer.id,
                        parentReplyId: reply.id,
                        authorId: members[(i + 2) % members.length].id,
                        content: `${MARK} Even in the mountains?`,
                        depth: 1,
                        path: `${answer.id}.1.1`,
                    },
                });
                await prisma.answerReply.create({
                    data: {
                        answerId: answer.id,
                        parentReplyId: nested.id,
                        authorId: question.authorId,
                        content: `${MARK} The Atlas is fine, the plains are not.`,
                        depth: 2,
                        path: `${answer.id}.1.1.1`,
                    },
                });
                await prisma.answerReplyLike.create({
                    data: { answerReplyId: reply.id, userId: admin.id },
                });
                await prisma.answer.update({
                    where: { id: answer.id },
                    data: { repliesCount: 3 },
                });

                if (!firstAnswer) {
                    firstAnswer = answer;
                    firstAnswerReply = reply;
                    firstNestedAnswerReply = nested;
                }
            }
        }

        const likers = [admin, ...members].slice(0, (i % 3) + 2);
        for (const u of likers) {
            await prisma.questionLike.create({ data: { questionId: question.id, userId: u.id } });
        }
        await prisma.question.update({
            where: { id: question.id },
            data: { answersCount: answerCount, likesCount: likers.length },
        });
    }

    // Popular-questions strip on the home page.
    for (const [i, question] of approvedQuestions.slice(0, 5).entries()) {
        const position = i + 1;
        const taken = await prisma.homeQuestion.findFirst({ where: { position } });
        if (taken) await prisma.homeQuestion.delete({ where: { id: taken.id } });
        await prisma.homeQuestion.create({ data: { questionId: question.id, position } });
    }

    // ── contact requests: every status (+ stored contact method) ────────────
    const crPending = await prisma.contactRequest.create({
        data: {
            requesterId: omar.id,
            receiverId: admin.id,
            status: 'PENDING',
            reason: `${MARK} Hi! I'd like to ask about your Sahara itinerary.`,
        },
    });
    await prisma.contactRequest.create({
        data: {
            requesterId: admin.id,
            receiverId: lina.id,
            status: 'ACCEPTED',
            reason: `${MARK} Loved your Aswan post — can we talk about winter routes?`,
            contactMethod: { create: { type: 'WHATSAPP', value: '+201234567890' } },
        },
    });
    await prisma.contactRequest.create({
        data: {
            requesterId: youssef.id,
            receiverId: admin.id,
            status: 'DECLINED',
            reason: `${MARK} Requesting contact about a paid collaboration.`,
        },
    });
    await prisma.contactRequest.create({
        data: {
            requesterId: hala.id,
            receiverId: admin.id,
            status: 'PENDING',
            reason: `${MARK} أرغب في السؤال عن تفاصيل الرحلة إلى البتراء.`,
        },
    });

    // ── reports: one per target type we have data for ────────────────────────
    const reportSpecs = [
        { targetType: 'COMMENT' as const, commentId: firstComment!.id, reason: `${MARK} Spam / off-topic comment` },
        { targetType: 'COMMENT_REPLY' as const, replyId: firstReply!.id, reason: `${MARK} Rude reply to another member` },
        { targetType: 'COMMENT_REPLY_REPLY' as const, replyId: firstNestedReply!.id, reason: `${MARK} Personal attack in a nested reply` },
        { targetType: 'ANSWER' as const, answerId: firstAnswer!.id, reason: `${MARK} Dangerous advice in an answer` },
        { targetType: 'ANSWER_REPLY' as const, answerReplyId: firstAnswerReply!.id, reason: `${MARK} Misinformation in an answer reply` },
        { targetType: 'ANSWER_REPLY_REPLY' as const, answerReplyId: firstNestedAnswerReply!.id, reason: `${MARK} Harassment in a nested answer reply` },
        { targetType: 'CONTACT_REQUEST' as const, contactRequestId: crPending.id, reason: `${MARK} Harassing contact request` },
    ];
    for (const [i, spec] of reportSpecs.entries()) {
        await prisma.report.create({
            data: {
                reporterId: members[i % members.length].id,
                status: i === reportSpecs.length - 1 ? 'PENDING' : i % 3 === 0 ? 'PENDING' : 'PENDING',
                ...spec,
            },
        });
    }

    // ── ads: active / inactive / expired / future + all three home slots ─────
    const adSpecs = [
        { t: 'Desert Camp Getaway', pos: 'TOP' as const, active: true, days: 60 },
        { t: 'Red Sea Dive Packages', pos: 'MIDDLE' as const, active: true, days: 30 },
        { t: 'Atlas Mountains Trek', pos: 'BOTTOM' as const, active: true, days: 90 },
        { t: 'Expired Winter Campaign', pos: null, active: true, days: -5 },
        { t: 'Paused Summer Campaign', pos: null, active: false, days: 45 },
    ];
    for (const [i, spec] of adSpecs.entries()) {
        const ad = await prisma.ad.create({
            data: {
                title: `${MARK} ${spec.t}`,
                text: 'Seeded advertisement used for manual QA of the ad admin screens and the home/thread ad slots.',
                link: 'https://example.com/seed-qa-ad',
                buttonText: 'Book now',
                amountPaid: 150 + i * 75,
                priority: i + 1,
                imageOriginalName: `seed-qa-ad-${i}.jpg`,
                imageUrl: img(`seedqa-ad-${i}`, 900, 600),
                imagePublicId: `seed-qa/ad-${i}`,
                imageWidth: 900,
                imageHeight: 600,
                addedById: admin.id,
                isActive: spec.active,
                expireAt: new Date(Date.now() + spec.days * 24 * 60 * 60 * 1000),
            },
        });
        if (spec.pos) {
            const taken = await prisma.homeAd.findUnique({ where: { position: spec.pos } });
            if (taken) await prisma.homeAd.delete({ where: { id: taken.id } });
            await prisma.homeAd.create({ data: { adId: ad.id, position: spec.pos } });
        }
    }

    // ── notifications: one of every type, addressed to the admin ────────────
    const notif = async (
        type: any,
        lastActor: { id: string },
        isRead: boolean,
        subtype: Record<string, unknown>,
        numberOfActors = 1,
        actors: { id: string }[] = []
    ) => {
        const n = await prisma.notification.create({
            data: {
                type,
                recipientId: admin.id,
                lastActorId: lastActor.id,
                isRead,
                numberOfActors,
                groupKey: `${type}:seed-qa`,
                ...subtype,
            },
        });
        for (const a of actors) {
            await prisma.notificationActor.create({
                data: { notificationId: n.id, actorId: a.id },
            });
        }
        return n;
    };

    const adminPost = await prisma.post.create({
        data: {
            authorId: admin.id,
            title: `${MARK} Admin's own post (notification target)`,
            titleNormalized: normalizeArabic(`${MARK} Admin's own post`),
            content: `<p>${MARK} This post belongs to the admin so their notifications point somewhere real.</p>`,
            status: 'APPROVED',
            images: {
                create: [
                    {
                        originalName: 'seed-qa-admin-post.jpg',
                        imageUrl: img('seedqa-admin-post'),
                        publicId: 'seed-qa/admin-post',
                        width: 1200,
                        height: 800,
                    },
                ],
            },
            tags: { create: [{ tagId: tags.get('egypt')!.id, name: 'egypt' }] },
        },
    });
    const adminQuestion = await prisma.question.create({
        data: {
            authorId: admin.id,
            title: `${MARK} Admin's own question (notification target)`,
            titleNormalized: normalizeArabic(`${MARK} Admin's own question`),
            content: `<p>${MARK} Question owned by the admin account.</p>`,
            status: 'APPROVED',
            tags: { create: [{ tagId: tags.get('jordan')!.id, name: 'jordan' }] },
        },
    });
    const adminPostComment = await prisma.comment.create({
        data: {
            postId: adminPost.id,
            authorId: sara.id,
            content: `${MARK} Commenting on the admin's post.`,
        },
    });
    const adminPostReply = await prisma.reply.create({
        data: {
            commentId: adminPostComment.id,
            authorId: omar.id,
            content: `${MARK} Replying to that comment.`,
            depth: 0,
            path: `${adminPostComment.id}.1`,
        },
    });
    const adminPostNestedReply = await prisma.reply.create({
        data: {
            commentId: adminPostComment.id,
            parentReplyId: adminPostReply.id,
            authorId: lina.id,
            content: `${MARK} Replying to the reply.`,
            depth: 1,
            path: `${adminPostComment.id}.1.1`,
        },
    });
    const adminAnswer = await prisma.answer.create({
        data: {
            questionId: adminQuestion.id,
            authorId: youssef.id,
            content: `${MARK} Answering the admin's question.`,
        },
    });
    const adminAnswerReply = await prisma.answerReply.create({
        data: {
            answerId: adminAnswer.id,
            authorId: hala.id,
            content: `${MARK} Replying to that answer.`,
            depth: 0,
            path: `${adminAnswer.id}.1`,
        },
    });
    const adminAnswerNestedReply = await prisma.answerReply.create({
        data: {
            answerId: adminAnswer.id,
            parentReplyId: adminAnswerReply.id,
            authorId: karim.id,
            content: `${MARK} Replying to the answer reply.`,
            depth: 1,
            path: `${adminAnswer.id}.1.1`,
        },
    });
    await prisma.post.update({ where: { id: adminPost.id }, data: { commentsCount: 1 } });
    await prisma.question.update({ where: { id: adminQuestion.id }, data: { answersCount: 1 } });
    await prisma.comment.update({ where: { id: adminPostComment.id }, data: { repliesCount: 2 } });
    await prisma.answer.update({ where: { id: adminAnswer.id }, data: { repliesCount: 2 } });

    // aggregated like notification (3 actors → "X and 2 others")
    await notif('POST_LIKE', sara, false, {
        postLike: { create: { postId: adminPost.id } },
    }, 3, [sara, omar, lina]);

    await notif('QUESTION_LIKE', omar, false, {
        questionLike: { create: { questionId: adminQuestion.id } },
    }, 2, [omar, hala]);

    await notif('COMMENT', sara, false, {
        postComment: { create: { postId: adminPost.id, lastCommentId: adminPostComment.id } },
    });

    await notif('ANSWER', youssef, true, {
        questionAnswer: { create: { questionId: adminQuestion.id, lastAnswerId: adminAnswer.id } },
    });

    await notif('COMMENT_REPLY', omar, false, {
        commentReply: {
            create: {
                postId: adminPost.id,
                commentId: adminPostComment.id,
                replyId: adminPostReply.id,
            },
        },
    });

    await notif('COMMENT_REPLY_REPLY', lina, false, {
        commentReplyReply: {
            create: {
                postId: adminPost.id,
                parentReplyId: adminPostReply.id,
                replyId: adminPostNestedReply.id,
            },
        },
    });

    await notif('ANSWER_REPLY', hala, true, {
        answerReply: {
            create: {
                questionId: adminQuestion.id,
                answerId: adminAnswer.id,
                replyId: adminAnswerReply.id,
            },
        },
    });

    await notif('ANSWER_REPLY_REPLY', karim, false, {
        answerReplyReply: {
            create: {
                questionId: adminQuestion.id,
                parentReplyId: adminAnswerReply.id,
                replyId: adminAnswerNestedReply.id,
            },
        },
    });

    await notif('POST_APPROVAL', admin, false, {
        postApproval: { create: { postId: adminPost.id } },
    });

    await notif('QUESTION_APPROVAL', admin, true, {
        questionApproval: { create: { questionId: adminQuestion.id } },
    });

    await notif('POST_REJECTION', admin, false, {
        postRejection: {
            create: {
                postTitle: `${MARK} A post that was rejected`,
                rejectionReason: 'Promotional content — please remove the affiliate links.',
            },
        },
    });

    await notif('QUESTION_REJECTION', admin, false, {
        questionRejection: {
            create: {
                questionTitle: `${MARK} A question that was rejected`,
                rejectionReason: 'Duplicate of an existing thread.',
            },
        },
    });

    await notif('TIER_UPGRADE', admin, false, {
        tierUpgradeNotification: {
            create: { oldTierId: memberTiers[0].id, newTierId: memberTiers[1].id },
        },
    });

    // ── announcements (global, no recipient) ────────────────────────────────
    const announcements = [
        `${MARK} Welcome to the new Maza3eat community guidelines — please read them before posting.`,
        `${MARK} إعلان: تم تحديث سياسة النشر، يرجى الاطلاع عليها.`,
        `${MARK} Scheduled maintenance this Friday from 02:00 to 04:00 (GMT+2).`,
    ];
    for (const [i, message] of announcements.entries()) {
        const n = await prisma.notification.create({
            data: {
                type: 'ADMIN_ANNOUNCEMENT',
                lastActorId: admin.id,
                adminNotification: { create: { message } },
            },
            include: { adminNotification: true },
        });
        // mark the oldest one as already read by the admin
        if (i === announcements.length - 1 && n.adminNotification) {
            await prisma.adminNotificationReadState.create({
                data: { userId: admin.id, adminNotificationId: n.adminNotification.id },
            });
        }
    }

    // ── audit log entries ───────────────────────────────────────────────────
    await prisma.auditLog.createMany({
        data: [
            { adminId: admin.id, action: 'APPROVE_POST', entityType: 'Post', entityId: approvedPosts[0].id },
            { adminId: admin.id, action: 'BAN_USER', entityType: 'User', entityId: bannedUser.id },
            { adminId: admin.id, action: 'CREATE_AD', entityType: 'Ad', entityId: 'seed-qa/ad-0' },
        ],
    });

    // ── summary ─────────────────────────────────────────────────────────────
    const totals = {
        users: await prisma.user.count(),
        bans: await prisma.ban.count(),
        posts: await prisma.post.count(),
        pendingPosts: await prisma.post.count({ where: { status: 'PENDING' } }),
        rejectedPosts: await prisma.post.count({ where: { status: 'REJECTED' } }),
        questions: await prisma.question.count(),
        pendingQuestions: await prisma.question.count({ where: { status: 'PENDING' } }),
        answers: await prisma.answer.count(),
        comments: await prisma.comment.count(),
        replies: await prisma.reply.count(),
        answerReplies: await prisma.answerReply.count(),
        homePosts: await prisma.homePost.count(),
        homeQuestions: await prisma.homeQuestion.count(),
        ads: await prisma.ad.count(),
        homeAds: await prisma.homeAd.count(),
        reports: await prisma.report.count(),
        contactRequests: await prisma.contactRequest.count(),
        notifications: await prisma.notification.count(),
        tags: await prisma.tag.count(),
    };
    console.log('\nseeded. totals:', totals);

    console.log('\nQA members (one per tier):');
    for (const m of members) {
        const tier = tiers.find((t) => t.id === m.tierId);
        console.log(`  ${m.name.padEnd(28)} tier=${tier?.name ?? '?'}  /profile/${m.id}`);
    }
    console.log(`  ${moderator.name.padEnd(28)} MODERATOR`);
    console.log(`  ${bannedUser.name.padEnd(28)} BANNED`);
    console.log('\nHandy links:');
    console.log(`  post:      /post/${approvedPosts[0].id}`);
    console.log(`  question:  /q&a/${approvedQuestions[0].id}`);
    console.log(`  admin post (has your notifications): /post/${adminPost.id}`);
    console.log('\nTrending tags are cached for 15 min — restart the backend to see them immediately.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
