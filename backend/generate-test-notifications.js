import { prisma } from './dist/lib/client.js';
import socketService from './dist/sockets/socket.service.js';
import notificationCount from './dist/modules/notifications/notification.count.js';

async function generateTestNotifications() {
  console.log('--- STARTING NOTIFICATION AND CONTACT REQUEST GENERATOR ---');

  // Find a target user (recipient) - Mohab Kamle
  let recipient = await prisma.user.findFirst({
    where: { name: { contains: 'Mohab' } }
  });
  if (!recipient) {
    recipient = await prisma.user.findFirst({
      orderBy: { createdAt: 'desc' }
    });
  }

  if (!recipient) {
    console.error('No users found in database! Please register or seed first.');
    return;
  }
  
  console.log(`Target Recipient User: ${recipient.name} (${recipient.id})`);

  // Find or create an actor (sender)
  let actor = await prisma.user.findFirst({
    where: { id: { not: recipient.id } }
  });

  if (!actor) {
    console.log('Creating a dummy test actor...');
    // Find a tier
    const tier = await prisma.tier.findFirst();
    actor = await prisma.user.create({
      data: {
        email: 'testactor@maza3eat.com',
        name: 'زارع اختبارات',
        avatar: 'https://i.pravatar.cc/150?img=33',
        tierId: tier ? tier.id : 1
      }
    });
  }

  console.log(`Actor/Sender User: ${actor.name} (${actor.id})`);

  // Ensure we have a Post and a Question owned by recipient to trigger likes/comments/answers
  let post = await prisma.post.findFirst({ where: { authorId: recipient.id } });
  if (!post) {
    post = await prisma.post.create({
      data: {
        title: 'منشور تجريبي لاختبار الإشعارات',
        titleNormalized: 'منشور تجريبي لاختبار الاشعارات',
        content: 'هذا منشور تم إنشاؤه تلقائياً لاختبار نظام الإشعارات والـ WebSockets.',
        authorId: recipient.id,
        status: 'APPROVED'
      }
    });
  }

  let question = await prisma.question.findFirst({ where: { authorId: recipient.id } });
  if (!question) {
    question = await prisma.question.create({
      data: {
        title: 'سؤال تجريبي لاختبار الإشعارات والردود؟',
        titleNormalized: 'سؤال تجريبي لاختبار الاشعارات والردود',
        content: 'كيف يمكنني فحص إشعار إجابة جديدة في التطبيق؟',
        authorId: recipient.id,
        status: 'APPROVED'
      }
    });
  }

  // Create a comment owned by recipient so actor can reply to it
  let comment = await prisma.comment.findFirst({ where: { authorId: recipient.id, postId: post.id } });
  if (!comment) {
    comment = await prisma.comment.create({
      data: {
        content: 'تعليقي الجميل على هذا المنشور',
        postId: post.id,
        authorId: recipient.id
      }
    });
  }

  // Create an answer owned by recipient so actor can reply to it
  let answer = await prisma.answer.findFirst({ where: { authorId: recipient.id, questionId: question.id } });
  if (!answer) {
    answer = await prisma.answer.create({
      data: {
        content: 'إجابتي الشاملة على السؤال المطروح',
        questionId: question.id,
        authorId: recipient.id
      }
    });
  }

  console.log('Seeded necessary entities (Posts, Questions, Comments, Answers)');

  // Clear existing notifications to keep it clean
  await prisma.notification.deleteMany({ where: { recipientId: recipient.id } });
  await prisma.contactRequest.deleteMany({
    where: { OR: [{ requesterId: recipient.id }, { receiverId: recipient.id }] }
  });
  console.log('Cleared existing notifications/contact requests for a fresh slate.');

  const now = new Date();

  // ─── 1. POST_LIKE Notification ───
  console.log('Creating POST_LIKE...');
  await prisma.notification.create({
    data: {
      type: 'POST_LIKE',
      recipientId: recipient.id,
      lastActorId: actor.id,
      lastActivityAt: now,
      groupKey: `POST_LIKE:${post.id}`,
      postLike: { create: { postId: post.id } },
      actors: { create: { actorId: actor.id } }
    }
  });

  // ─── 2. QUESTION_LIKE Notification ───
  console.log('Creating QUESTION_LIKE...');
  await prisma.notification.create({
    data: {
      type: 'QUESTION_LIKE',
      recipientId: recipient.id,
      lastActorId: actor.id,
      lastActivityAt: now,
      groupKey: `QUESTION_LIKE:${question.id}`,
      questionLike: { create: { questionId: question.id } },
      actors: { create: { actorId: actor.id } }
    }
  });

  // ─── 3. COMMENT Notification ───
  console.log('Creating COMMENT...');
  const actorComment = await prisma.comment.create({
    data: {
      content: 'تعليق رائع ومثير للاهتمام!',
      postId: post.id,
      authorId: actor.id
    }
  });
  await prisma.notification.create({
    data: {
      type: 'COMMENT',
      recipientId: recipient.id,
      lastActorId: actor.id,
      lastActivityAt: now,
      groupKey: `POST_COMMENT:${post.id}`,
      postComment: { create: { postId: post.id, lastCommentId: actorComment.id } },
      actors: { create: { actorId: actor.id } }
    }
  });

  // ─── 4. ANSWER Notification ───
  console.log('Creating ANSWER...');
  const actorAnswer = await prisma.answer.create({
    data: {
      content: 'أقترح تجربة this solution السريع.',
      questionId: question.id,
      authorId: actor.id
    }
  });
  await prisma.notification.create({
    data: {
      type: 'ANSWER',
      recipientId: recipient.id,
      lastActorId: actor.id,
      lastActivityAt: now,
      groupKey: `QUESTION_ANSWER:${question.id}`,
      questionAnswer: { create: { questionId: question.id, lastAnswerId: actorAnswer.id } },
      actors: { create: { actorId: actor.id } }
    }
  });

  // ─── 5. COMMENT_REPLY Notification ───
  console.log('Creating COMMENT_REPLY...');
  const randomSuffix = Math.floor(Math.random() * 100000);
  const commentReply = await prisma.reply.create({
    data: {
      content: 'شكراً جزيلاً لتنبيهي بخصوص هذا!',
      commentId: comment.id,
      authorId: actor.id,
      path: `1-${randomSuffix}`
    }
  });
  await prisma.notification.create({
    data: {
      type: 'COMMENT_REPLY',
      recipientId: recipient.id,
      lastActorId: actor.id,
      lastActivityAt: now,
      commentReply: { create: { postId: post.id, commentId: comment.id, replyId: commentReply.id } }
    }
  });

  // ─── 6. ANSWER_REPLY Notification ───
  console.log('Creating ANSWER_REPLY...');
  const answerReply = await prisma.answerReply.create({
    data: {
      content: 'هذا صحيح تماماً، أتفق معك.',
      answerId: answer.id,
      authorId: actor.id,
      path: `1-${randomSuffix}`
    }
  });
  await prisma.notification.create({
    data: {
      type: 'ANSWER_REPLY',
      recipientId: recipient.id,
      lastActorId: actor.id,
      lastActivityAt: now,
      answerReply: { create: { questionId: question.id, answerId: answer.id, replyId: answerReply.id } }
    }
  });

  // ─── 7. COMMENT_REPLY_REPLY Notification ───
  console.log('Creating COMMENT_REPLY_REPLY...');
  const commentReplyReply = await prisma.reply.create({
    data: {
      content: 'وأنا أرد أيضاً على ردك هنا!',
      commentId: comment.id,
      authorId: actor.id,
      parentReplyId: commentReply.id,
      path: `1-${randomSuffix}.2`
    }
  });
  await prisma.notification.create({
    data: {
      type: 'COMMENT_REPLY_REPLY',
      recipientId: recipient.id,
      lastActorId: actor.id,
      lastActivityAt: now,
      commentReplyReply: { create: { postId: post.id, parentReplyId: commentReply.id, replyId: commentReplyReply.id } }
    }
  });

  // ─── 8. ANSWER_REPLY_REPLY Notification ───
  console.log('Creating ANSWER_REPLY_REPLY...');
  const answerReplyReply = await prisma.answerReply.create({
    data: {
      content: 'متابع للرد على الإجابة.',
      answerId: answer.id,
      authorId: actor.id,
      parentReplyId: answerReply.id,
      path: `1-${randomSuffix}.2`
    }
  });
  await prisma.notification.create({
    data: {
      type: 'ANSWER_REPLY_REPLY',
      recipientId: recipient.id,
      lastActorId: actor.id,
      lastActivityAt: now,
      answerReplyReply: { create: { questionId: question.id, parentReplyId: answerReply.id, replyId: answerReplyReply.id } }
    }
  });

  // ─── 9. POST_APPROVAL Notification ───
  console.log('Creating POST_APPROVAL...');
  await prisma.notification.create({
    data: {
      type: 'POST_APPROVAL',
      recipientId: recipient.id,
      lastActorId: actor.id, // System/Admin actor
      lastActivityAt: now,
      postApproval: { create: { postId: post.id } }
    }
  });

  // ─── 10. QUESTION_APPROVAL Notification ───
  console.log('Creating QUESTION_APPROVAL...');
  await prisma.notification.create({
    data: {
      type: 'QUESTION_APPROVAL',
      recipientId: recipient.id,
      lastActorId: actor.id,
      lastActivityAt: now,
      questionApproval: { create: { questionId: question.id } }
    }
  });

  // ─── 11. POST_REJECTION Notification ───
  console.log('Creating POST_REJECTION...');
  await prisma.notification.create({
    data: {
      type: 'POST_REJECTION',
      recipientId: recipient.id,
      lastActorId: actor.id,
      lastActivityAt: now,
      postRejection: { create: { postTitle: 'منشورك التجريبي المرفوض', rejectionReason: 'محتوى مكرر أو غير ملائم لشروط النشر الخاصة بالمزرعة.' } }
    }
  });

  // ─── 12. QUESTION_REJECTION Notification ───
  console.log('Creating QUESTION_REJECTION...');
  await prisma.notification.create({
    data: {
      type: 'QUESTION_REJECTION',
      recipientId: recipient.id,
      lastActorId: actor.id,
      lastActivityAt: now,
      questionRejection: { create: { questionTitle: 'سؤالك التجريبي المرفوض؟', rejectionReason: 'مخالف لقواعد طرح الأسئلة، يرجى الصياغة بشكل أوضح.' } }
    }
  });

  // ─── 13. PENDING RECEIVED CONTACT REQUEST ───
  console.log('Creating RECEIVED:PENDING Contact Request...');
  await prisma.contactRequest.create({
    data: {
      requesterId: actor.id,
      receiverId: recipient.id,
      reason: 'أود التواصل معك للاستفسار عن منتجات المزرعة المعروضة.',
      status: 'PENDING',
      lastActivityAt: now
    }
  });

  // ─── 14. ACCEPTED SENT CONTACT REQUEST ───
  console.log('Creating SENT:ACCEPTED Contact Request...');
  // Need to encrypt contact details properly using ContactUtils (from contact.utils.ts)
  const ContactUtilsModule = await import('./dist/modules/contactRequests/contact.utils.js');
  const contactUtils = ContactUtilsModule.default;
  const encryptedValue = contactUtils.encrypt('+201234567890');

  await prisma.contactRequest.create({
    data: {
      requesterId: recipient.id,
      receiverId: actor.id,
      reason: 'طلب تواصل أرسلته أنا وتم قبوله.',
      status: 'ACCEPTED',
      lastActivityAt: now,
      contactMethod: {
        create: {
          type: 'WHATSAPP',
          value: encryptedValue
        }
      }
    }
  });

  console.log('All notifications and contact requests successfully seeded!');

  // Emit unread notification count via socket
  const unreadCountObj = await notificationCount.getUnreadNotificationCount(recipient.id);
  console.log(`Emitting updated unread count to Socket IO: ${unreadCountObj.count}`);
  try {
    socketService.emitNotificationCount(recipient.id, unreadCountObj);
  } catch (e) {
    console.log('Socket IO is not initialized or server is offline, count will update on refresh.');
  }

  console.log('--- TEST NOTIFICATIONS GENERATOR FINISHED SUCCESSFULLY ---');
}

generateTestNotifications()
  .catch(err => {
    console.error('Error seeding test notifications:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
