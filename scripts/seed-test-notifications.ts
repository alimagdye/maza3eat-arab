/**
 * Seed all notification types and contact-request scenarios for a single account.
 *
 * Usage:
 *   npx tsx scripts/seed-test-notifications.ts --email you@example.com
 *   npx tsx scripts/seed-test-notifications.ts --userId <uuid>
 *   npx tsx scripts/seed-test-notifications.ts --list-users
 *   npx tsx scripts/seed-test-notifications.ts --email you@example.com --fresh
 *   npx tsx scripts/seed-test-notifications.ts --email you@example.com --cleanup
 */

import socketService from '../src/sockets/socket.service.js';
import notificationWriter from '../src/modules/notifications/notification.writer.js';
import contactService from '../src/modules/contactRequests/contact.service.js';
import { prisma } from '../src/lib/client.js';

const TEST_MARKER = '[TEST-NOTIFICATIONS]';
const TEST_ACTOR_GOOGLE_ID = 'test-seed-notifications-actor';
const TEST_ACTOR_EMAIL = 'test-notifications-actor@maza3eat.local';

// Socket.IO is not running in this standalone script.
socketService.emitNotificationCount = async () => {};

type Args = {
    email?: string;
    userId?: string;
    listUsers: boolean;
    fresh: boolean;
    cleanup: boolean;
};

function parseArgs(argv: string[]): Args {
    const args: Args = {
        listUsers: false,
        fresh: false,
        cleanup: false,
    };

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--email') args.email = argv[++i];
        else if (arg === '--userId') args.userId = argv[++i];
        else if (arg === '--list-users') args.listUsers = true;
        else if (arg === '--fresh') args.fresh = true;
        else if (arg === '--cleanup') args.cleanup = true;
        else if (arg === '--help' || arg === '-h') {
            printHelp();
            process.exit(0);
        }
    }

    return args;
}

function printHelp() {
    console.log(`
Seed test notifications and contact requests for one account.

Options:
  --email <email>     Target user email (your signed-in account)
  --userId <uuid>     Target user id
  --list-users        Print users in the database
  --fresh             Remove previous test data, then seed again
  --cleanup           Remove test data only (no seed)
  --help              Show this help

Examples:
  npx tsx scripts/seed-test-notifications.ts --list-users
  npx tsx scripts/seed-test-notifications.ts --email you@gmail.com
  npx tsx scripts/seed-test-notifications.ts --email you@gmail.com --fresh
`);
}

async function listUsers() {
    const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true },
        orderBy: { createdAt: 'asc' },
    });

    if (users.length === 0) {
        console.log('No users found.');
        return;
    }

    console.log('Users:');
    for (const user of users) {
        console.log(`  ${user.email}  (${user.name}, ${user.role})`);
        console.log(`    id: ${user.id}`);
    }
}

async function resolveTargetUser(args: Args) {
    if (args.userId) {
        const user = await prisma.user.findUnique({
            where: { id: args.userId },
            select: { id: true, name: true, email: true },
        });
        if (!user) throw new Error(`User not found: ${args.userId}`);
        return user;
    }

    if (args.email) {
        const user = await prisma.user.findUnique({
            where: { email: args.email },
            select: { id: true, name: true, email: true },
        });
        if (!user) throw new Error(`User not found: ${args.email}`);
        return user;
    }

    throw new Error('Pass --email or --userId (or use --list-users).');
}

async function getDefaultTierId() {
    const tier = await prisma.tier.findFirst({ orderBy: { id: 'asc' } });
    if (!tier) throw new Error('No tiers found. Run: npm run db:seed');
    return tier.id;
}

async function getOrCreateTestActor(tierId: number) {
    const existing = await prisma.user.findUnique({
        where: { googleId: TEST_ACTOR_GOOGLE_ID },
        select: { id: true, name: true, email: true },
    });

    if (existing) return existing;

    return prisma.user.create({
        data: {
            googleId: TEST_ACTOR_GOOGLE_ID,
            name: `${TEST_MARKER} Actor`,
            email: TEST_ACTOR_EMAIL,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test-notifications',
            tierId,
        },
        select: { id: true, name: true, email: true },
    });
}

async function getAdminActorId(fallbackActorId: string) {
    const admin = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
        select: { id: true },
    });
    return admin?.id ?? fallbackActorId;
}

async function cleanupTestData(targetId: string, actorId: string) {
    const testPosts = await prisma.post.findMany({
        where: { title: { startsWith: TEST_MARKER } },
        select: { id: true },
    });
    const testQuestions = await prisma.question.findMany({
        where: { title: { startsWith: TEST_MARKER } },
        select: { id: true },
    });
    const testPostIds = testPosts.map((post) => post.id);
    const testQuestionIds = testQuestions.map((question) => question.id);

    const [
        actorNotifications,
        postApprovalNotifications,
        questionApprovalNotifications,
        postRejectionNotifications,
        questionRejectionNotifications,
    ] = await Promise.all([
        prisma.notification.findMany({
            where: { recipientId: targetId, lastActorId: actorId },
            select: { id: true },
        }),
        prisma.postApprovalNotification.findMany({
            where: { postId: { in: testPostIds } },
            select: { notificationId: true },
        }),
        prisma.questionApprovalNotification.findMany({
            where: { questionId: { in: testQuestionIds } },
            select: { notificationId: true },
        }),
        prisma.postRejectionNotification.findMany({
            where: { postTitle: { startsWith: TEST_MARKER } },
            select: { notificationId: true },
        }),
        prisma.questionRejectionNotification.findMany({
            where: { questionTitle: { startsWith: TEST_MARKER } },
            select: { notificationId: true },
        }),
    ]);

    const notificationIds = [
        ...actorNotifications.map((notification) => notification.id),
        ...postApprovalNotifications.map((notification) => notification.notificationId),
        ...questionApprovalNotifications.map(
            (notification) => notification.notificationId,
        ),
        ...postRejectionNotifications.map(
            (notification) => notification.notificationId,
        ),
        ...questionRejectionNotifications.map(
            (notification) => notification.notificationId,
        ),
    ];

    if (notificationIds.length > 0) {
        await prisma.notification.deleteMany({
            where: { id: { in: notificationIds } },
        });
    }

    await prisma.contactRequest.deleteMany({
        where: {
            OR: [
                { requesterId: actorId, receiverId: targetId },
                { requesterId: targetId, receiverId: actorId },
            ],
        },
    });

    await prisma.post.deleteMany({
        where: {
            OR: [
                { authorId: targetId, title: { startsWith: TEST_MARKER } },
                { authorId: actorId, title: { startsWith: TEST_MARKER } },
            ],
        },
    });

    await prisma.question.deleteMany({
        where: {
            OR: [
                { authorId: targetId, title: { startsWith: TEST_MARKER } },
                { authorId: actorId, title: { startsWith: TEST_MARKER } },
            ],
        },
    });

    const actor = await prisma.user.findUnique({
        where: { id: actorId },
        select: { googleId: true },
    });

    if (actor?.googleId === TEST_ACTOR_GOOGLE_ID) {
        await prisma.user.delete({ where: { id: actorId } });
    }

    console.log('Removed previous test notifications, contact requests, and fixture content.');
}

async function cleanupTestDataWithoutActor(targetId: string) {
    const testPosts = await prisma.post.findMany({
        where: { title: { startsWith: TEST_MARKER } },
        select: { id: true },
    });
    const testQuestions = await prisma.question.findMany({
        where: { title: { startsWith: TEST_MARKER } },
        select: { id: true },
    });
    const testPostIds = testPosts.map((post) => post.id);
    const testQuestionIds = testQuestions.map((question) => question.id);

    const [
        postApprovalNotifications,
        questionApprovalNotifications,
        postRejectionNotifications,
        questionRejectionNotifications,
    ] = await Promise.all([
        prisma.postApprovalNotification.findMany({
            where: { postId: { in: testPostIds } },
            select: { notificationId: true },
        }),
        prisma.questionApprovalNotification.findMany({
            where: { questionId: { in: testQuestionIds } },
            select: { notificationId: true },
        }),
        prisma.postRejectionNotification.findMany({
            where: { postTitle: { startsWith: TEST_MARKER } },
            select: { notificationId: true },
        }),
        prisma.questionRejectionNotification.findMany({
            where: { questionTitle: { startsWith: TEST_MARKER } },
            select: { notificationId: true },
        }),
    ]);

    const notificationIds = [
        ...postApprovalNotifications.map(
            (notification) => notification.notificationId,
        ),
        ...questionApprovalNotifications.map(
            (notification) => notification.notificationId,
        ),
        ...postRejectionNotifications.map(
            (notification) => notification.notificationId,
        ),
        ...questionRejectionNotifications.map(
            (notification) => notification.notificationId,
        ),
    ];

    if (notificationIds.length > 0) {
        await prisma.notification.deleteMany({
            where: { id: { in: notificationIds } },
        });
    }

    await prisma.post.deleteMany({
        where: { title: { startsWith: TEST_MARKER } },
    });

    await prisma.question.deleteMany({
        where: { title: { startsWith: TEST_MARKER } },
    });

    console.log('Removed previous test fixture content.');
}

async function createFixtures(targetId: string, actorId: string) {
    const targetPost = await prisma.post.create({
        data: {
            authorId: targetId,
            title: `${TEST_MARKER} Target post`,
            titleNormalized: `${TEST_MARKER} target post`.toLowerCase(),
            content: 'Test post used to generate notification previews.',
            status: 'APPROVED',
        },
    });

    const targetQuestion = await prisma.question.create({
        data: {
            authorId: targetId,
            title: `${TEST_MARKER} Target question`,
            titleNormalized: `${TEST_MARKER} target question`.toLowerCase(),
            content: 'Test question used to generate notification previews.',
            status: 'APPROVED',
        },
    });

    const actorPost = await prisma.post.create({
        data: {
            authorId: actorId,
            title: `${TEST_MARKER} Actor post`,
            titleNormalized: `${TEST_MARKER} actor post`.toLowerCase(),
            content: 'Post where the target user leaves comments and replies.',
            status: 'APPROVED',
        },
    });

    const actorQuestion = await prisma.question.create({
        data: {
            authorId: actorId,
            title: `${TEST_MARKER} Actor question`,
            titleNormalized: `${TEST_MARKER} actor question`.toLowerCase(),
            content: 'Question where the target user leaves answers and replies.',
            status: 'APPROVED',
        },
    });

    const actorCommentOnTargetPost = await prisma.comment.create({
        data: {
            postId: targetPost.id,
            authorId: actorId,
            content: 'Actor comment on target post.',
        },
    });

    const actorAnswerOnTargetQuestion = await prisma.answer.create({
        data: {
            questionId: targetQuestion.id,
            authorId: actorId,
            content: 'Actor answer on target question.',
        },
    });

    const targetComment = await prisma.comment.create({
        data: {
            postId: actorPost.id,
            authorId: targetId,
            content: 'Target comment for reply notifications.',
        },
    });

    const actorReplyToTargetComment = await prisma.reply.create({
        data: {
            commentId: targetComment.id,
            authorId: actorId,
            content: 'Actor reply to target comment.',
            path: `${targetComment.id}.1`,
            depth: 0,
        },
    });

    const targetReply = await prisma.reply.create({
        data: {
            commentId: targetComment.id,
            authorId: targetId,
            parentReplyId: actorReplyToTargetComment.id,
            content: 'Target nested reply for reply-reply notifications.',
            path: `${actorReplyToTargetComment.path}.1`,
            depth: 1,
        },
    });

    const actorReplyToTargetReply = await prisma.reply.create({
        data: {
            commentId: targetComment.id,
            authorId: actorId,
            parentReplyId: targetReply.id,
            content: 'Actor reply to target nested reply.',
            path: `${targetReply.path}.1`,
            depth: 2,
        },
    });

    const targetAnswer = await prisma.answer.create({
        data: {
            questionId: actorQuestion.id,
            authorId: targetId,
            content: 'Target answer for reply notifications.',
        },
    });

    const actorReplyToTargetAnswer = await prisma.answerReply.create({
        data: {
            answerId: targetAnswer.id,
            authorId: actorId,
            content: 'Actor reply to target answer.',
            path: `${targetAnswer.id}.1`,
            depth: 0,
        },
    });

    const targetAnswerReply = await prisma.answerReply.create({
        data: {
            answerId: targetAnswer.id,
            authorId: targetId,
            parentReplyId: actorReplyToTargetAnswer.id,
            content: 'Target nested answer reply.',
            path: `${actorReplyToTargetAnswer.path}.1`,
            depth: 1,
        },
    });

    const actorReplyToTargetAnswerReply = await prisma.answerReply.create({
        data: {
            answerId: targetAnswer.id,
            authorId: actorId,
            parentReplyId: targetAnswerReply.id,
            content: 'Actor reply to target nested answer reply.',
            path: `${targetAnswerReply.path}.1`,
            depth: 2,
        },
    });

    return {
        targetPost,
        targetQuestion,
        actorPost,
        actorQuestion,
        actorCommentOnTargetPost,
        actorAnswerOnTargetQuestion,
        targetComment,
        actorReplyToTargetComment,
        targetReply,
        actorReplyToTargetReply,
        targetAnswer,
        actorReplyToTargetAnswer,
        targetAnswerReply,
        actorReplyToTargetAnswerReply,
    };
}

async function seedNotifications(
    targetId: string,
    actorId: string,
    adminId: string,
    fixtures: Awaited<ReturnType<typeof createFixtures>>,
) {
    const created: string[] = [];

    await notificationWriter.createCommentOrAnswerNotification({
        recipientId: targetId,
        actorId,
        type: 'COMMENT',
        postId: fixtures.targetPost.id,
        commentId: fixtures.actorCommentOnTargetPost.id,
    });
    created.push('COMMENT');

    await notificationWriter.createCommentOrAnswerNotification({
        recipientId: targetId,
        actorId,
        type: 'ANSWER',
        questionId: fixtures.targetQuestion.id,
        answerId: fixtures.actorAnswerOnTargetQuestion.id,
    });
    created.push('ANSWER');

    await notificationWriter.createReplyNotification({
        recipientId: targetId,
        actorId,
        type: 'COMMENT_REPLY',
        postId: fixtures.actorPost.id,
        commentId: fixtures.targetComment.id,
        replyId: fixtures.actorReplyToTargetComment.id,
    });
    created.push('COMMENT_REPLY');

    await notificationWriter.createReplyNotification({
        recipientId: targetId,
        actorId,
        type: 'COMMENT_REPLY_REPLY',
        postId: fixtures.actorPost.id,
        parentReplyId: fixtures.targetReply.id,
        replyId: fixtures.actorReplyToTargetReply.id,
    });
    created.push('COMMENT_REPLY_REPLY');

    await notificationWriter.createReplyNotification({
        recipientId: targetId,
        actorId,
        type: 'ANSWER_REPLY',
        questionId: fixtures.actorQuestion.id,
        answerId: fixtures.targetAnswer.id,
        replyId: fixtures.actorReplyToTargetAnswer.id,
    });
    created.push('ANSWER_REPLY');

    await notificationWriter.createReplyNotification({
        recipientId: targetId,
        actorId,
        type: 'ANSWER_REPLY_REPLY',
        questionId: fixtures.actorQuestion.id,
        parentReplyId: fixtures.targetAnswerReply.id,
        replyId: fixtures.actorReplyToTargetAnswerReply.id,
    });
    created.push('ANSWER_REPLY_REPLY');

    await notificationWriter.createPostOrQuestionLikeNotification({
        recipientId: targetId,
        actorId,
        type: 'POST_LIKE',
        postId: fixtures.targetPost.id,
    });
    created.push('POST_LIKE');

    await notificationWriter.createPostOrQuestionLikeNotification({
        recipientId: targetId,
        actorId,
        type: 'QUESTION_LIKE',
        questionId: fixtures.targetQuestion.id,
    });
    created.push('QUESTION_LIKE');

    await notificationWriter.createPostOrQuestionApprovalNotification({
        recipientId: targetId,
        actorId: adminId,
        type: 'POST_APPROVAL',
        postId: fixtures.targetPost.id,
    });
    created.push('POST_APPROVAL');

    await notificationWriter.createPostOrQuestionApprovalNotification({
        recipientId: targetId,
        actorId: adminId,
        type: 'QUESTION_APPROVAL',
        questionId: fixtures.targetQuestion.id,
    });
    created.push('QUESTION_APPROVAL');

    await notificationWriter.createPostOrQuestionRejectionNotification({
        recipientId: targetId,
        actorId: adminId,
        type: 'POST_REJECTION',
        title: `${TEST_MARKER} Rejected post title`,
        reason: 'Test rejection reason for post moderation preview.',
    });
    created.push('POST_REJECTION');

    await notificationWriter.createPostOrQuestionRejectionNotification({
        recipientId: targetId,
        actorId: adminId,
        type: 'QUESTION_REJECTION',
        title: `${TEST_MARKER} Rejected question title`,
        reason: 'Test rejection reason for question moderation preview.',
    });
    created.push('QUESTION_REJECTION');

    return created;
}

async function seedContactRequests(targetId: string, actorId: string) {
    const incoming = await contactService.createContactRequest(
        actorId,
        targetId,
        `${TEST_MARKER} Incoming contact request for UI testing.`,
    );

    const outgoing = await contactService.createContactRequest(
        targetId,
        actorId,
        `${TEST_MARKER} Outgoing contact request for UI testing.`,
    );

    await contactService.updateContactRequest(
        outgoing.id,
        actorId,
        'ACCEPTED',
        'EMAIL',
        'accepted-contact@example.com',
    );

    return {
        incomingPendingId: incoming.id,
        outgoingAcceptedId: outgoing.id,
    };
}

async function main() {
    const args = parseArgs(process.argv.slice(2));

    if (args.listUsers) {
        await listUsers();
        return;
    }

    const target = await resolveTargetUser(args);
    const tierId = await getDefaultTierId();

    if (args.cleanup || args.fresh) {
        const existingActor = await prisma.user.findUnique({
            where: { googleId: TEST_ACTOR_GOOGLE_ID },
            select: { id: true },
        });

        if (existingActor) {
            await cleanupTestData(target.id, existingActor.id);
        } else {
            await cleanupTestDataWithoutActor(target.id);
        }
    }

    if (args.cleanup && !args.fresh) {
        console.log(`Cleanup complete for ${target.email}.`);
        return;
    }

    const actor = await getOrCreateTestActor(tierId);

    const adminId = await getAdminActorId(actor.id);
    const fixtures = await createFixtures(target.id, actor.id);
    const notificationTypes = await seedNotifications(
        target.id,
        actor.id,
        adminId,
        fixtures,
    );
    const contactRequests = await seedContactRequests(target.id, actor.id);

    const unread = await prisma.notification.count({
        where: { recipientId: target.id, isRead: false },
    });

    console.log('');
    console.log(`Seeded test data for: ${target.name} <${target.email}>`);
    console.log(`Test actor: ${actor.name} <${actor.email}>`);
    console.log('');
    console.log('Notifications created:');
    for (const type of notificationTypes) {
        console.log(`  - ${type}`);
    }
    console.log('');
    console.log('Contact requests:');
    console.log(`  - RECEIVED:PENDING  id=${contactRequests.incomingPendingId}`);
    console.log(
        `  - SENT:ACCEPTED       id=${contactRequests.outgoingAcceptedId}`,
    );
    console.log('');
    console.log(`Unread notifications for target: ${unread}`);
    console.log('');
    console.log('Open the app while signed in as this user and refresh notifications/contact requests.');
    console.log('Re-run with --fresh to reset, or --cleanup to remove test data.');
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
