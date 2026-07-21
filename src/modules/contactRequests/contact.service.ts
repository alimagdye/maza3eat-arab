import { prisma } from '../../lib/client.js';
import ContactUtils from './contact.utils.js';
import { ContactMethod } from '../../types/contact.js';
import socketService from '../../sockets/socket.service.js';
import notificationCount from './../notifications/notification.count.js';

class ContactRequestService {
    private contactUtils = ContactUtils;
    async createContactRequest(
        requesterId: string,
        receiverId: string,
        reason: string,
    ) {
        if (requesterId === receiverId) {
            throw new Error('Cannot contact yourself');
        }

        const now = new Date();
        const cooldownMs = 7 * 24 * 60 * 60 * 1000;

        const result = await prisma.$transaction(async (tx) => {
            const existing = await tx.contactRequest.findUnique({
                where: {
                    requesterId_receiverId: {
                        requesterId,
                        receiverId,
                    },
                },
                select: {
                    id: true,
                    lastActivityAt: true,
                },
            });

            // cooldown check
            if (
                existing?.lastActivityAt &&
                now.getTime() - existing.lastActivityAt.getTime() < cooldownMs
            ) {
                const nextDate = new Date(
                    existing.lastActivityAt.getTime() + cooldownMs,
                );

                throw {
                    code: 'COOLDOWN',
                    nextAvailableAt: nextDate,
                };
            }

            // if exists: update (reuse row)
            if (existing) {
                return await tx.contactRequest.update({
                    where: { id: existing.id },
                    data: {
                        reason,
                        status: 'PENDING',
                        lastActivityAt: now,
                        receiverHasRead: false,
                        requesterHasRead: false,
                    },
                });
            }

            // else: create new
            return await tx.contactRequest.create({
                data: {
                    requesterId,
                    receiverId,
                    reason,
                    lastActivityAt: now,
                },
            });
        });
        socketService.emitNotificationCount(
            result.receiverId,
            await notificationCount.getUnreadNotificationCount(
                result.receiverId,
            ),
        );
        return result;
    }
    // if I am sender only show which accepted
    // if I am receiver show which is pending
    // show the type of the request is it received (pending) or sent (accepted)
    async getContactRequests(userId: string, cursor: string | null) {
        const take = 10;

        const requests = await prisma.contactRequest.findMany({
            where: {
                OR: [
                    {
                        requesterId: userId,
                        status: 'ACCEPTED',
                    },
                    {
                        receiverId: userId,
                        status: 'PENDING',
                    },
                ],
            },
            take: take + 1,
            ...(cursor && {
                skip: 1,
                cursor: { id: cursor },
            }),
            orderBy: [{ lastActivityAt: 'desc' }, { id: 'desc' }],
            select: {
                id: true,
                requesterId: true,
                receiverId: true,
                lastActivityAt: true,
                status: true,
                receiverHasRead: true,
                requesterHasRead: true,

                requester: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        tier: {
                            select: {
                                id: true,
                                name: true,
                                badgeColor: true,
                            },
                        },
                    },
                },

                receiver: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        tier: {
                            select: {
                                id: true,
                                name: true,
                                badgeColor: true,
                            },
                        },
                    },
                },
            },
        });

        const hasMore = requests.length > take;
        const sliced = hasMore ? requests.slice(0, take) : requests;

        const contactRequests = sliced.map((request) => {
            if (request.requesterId === userId) {
                return {
                    id: request.id,
                    requester: 'YOU',
                    receiver: request.receiver,
                    lastActivityAt: request.lastActivityAt,
                    type: 'SENT:ACCEPTED',
                    isRead: request.requesterHasRead,
                };
            }

            return {
                id: request.id,
                requester: request.requester,
                receiver: 'YOU',
                lastActivityAt: request.lastActivityAt,
                type: 'RECEIVED:PENDING',
                isRead: request.receiverHasRead,
            };
        });

        const nextCursor = hasMore ? sliced[sliced.length - 1].id : null;

        return { contactRequests, nextCursor, hasMore };
    }

    async updateContactRequest(
        contactRequestId: string,
        receiverId: string,
        status: 'ACCEPTED' | 'DECLINED',
        type?: ContactMethod,
        contactInfo?: string,
    ) {
        const now = new Date();

        const result = await prisma.$transaction(async (tx) => {
            const contactRequest = await tx.contactRequest.findUnique({
                where: { id: contactRequestId },
                select: {
                    requesterId: true,
                    receiverId: true,
                    status: true,
                },
            });

            if (!contactRequest || contactRequest.receiverId !== receiverId) {
                throw new Error('NOT_FOUND');
            }

            if (contactRequest.status !== 'PENDING') {
                throw new Error('ALREADY_RESPONDED');
            }

            // common update payload
            const baseData = {
                status,
                lastActivityAt: now,
                receiverHasRead: true,
            };

            if (status === 'DECLINED') {
                const updatedRequest = await tx.contactRequest.update({
                    where: { id: contactRequestId },
                    data: baseData,
                });

                return {
                    requesterId: contactRequest.requesterId,
                    status: updatedRequest.status,
                    lastActivityAt: updatedRequest.lastActivityAt,
                    isRead: updatedRequest.receiverHasRead,
                };
            }

            // ACCEPTED
            if (!contactInfo || !type) {
                throw new Error('MISSING_CONTACT_INFO');
            }

            const normalized = this.contactUtils.normalizeContact(
                type,
                contactInfo,
            );

            if (!this.contactUtils.validateContact(type, normalized)) {
                throw new Error('INVALID_CONTACT_INFO_FORMAT');
            }

            const encrypted = this.contactUtils.encrypt(normalized);

            const updatedRequest = await tx.contactRequest.update({
                where: { id: contactRequestId },
                data: {
                    ...baseData,
                    contactMethod: {
                        upsert: {
                            create: {
                                type,
                                value: encrypted,
                            },
                            update: {
                                type,
                                value: encrypted,
                            },
                        },
                    },
                },
            });

            return {
                requesterId: contactRequest.requesterId,
                status: updatedRequest.status,
                lastActivityAt: updatedRequest.lastActivityAt,
                isRead: updatedRequest.receiverHasRead,
            };
        });

        // emit only on ACCEPTED
        if (result.status === 'ACCEPTED') {
            socketService.emitNotificationCount(
                result.requesterId,
                await notificationCount.getUnreadNotificationCount(
                    result.requesterId,
                ),
            );
        }

        return {
            status: result.status,
            lastActivityAt: result.lastActivityAt,
            isRead: result.isRead,
        };
    }

    async getContactRequestById(userId: string, contactRequestId: string) {
        const contactRequest = await prisma.contactRequest.findFirst({
            where: {
                id: contactRequestId,
                OR: [
                    {
                        requesterId: userId,
                        status: 'ACCEPTED',
                    },
                    {
                        receiverId: userId,
                        status: 'PENDING',
                    },
                ],
            },
            select: {
                id: true,
                requesterId: true,
                receiverId: true,
                reason: true,
                status: true,
                lastActivityAt: true,
                requesterHasRead: true,
                receiverHasRead: true,
                contactMethod: {
                    select: {
                        type: true,
                        value: true,
                    },
                },
            },
        });

        if (!contactRequest) {
            throw new Error('NOT_FOUND');
        }

        const isRequester: boolean = contactRequest.requesterId === userId;

        const wasUnread = isRequester
            ? !contactRequest.requesterHasRead
            : !contactRequest.receiverHasRead;

        // update only if needed
        if (wasUnread) {
            await prisma.contactRequest.update({
                where: {
                    id: contactRequestId,
                },
                data: isRequester
                    ? { requesterHasRead: true }
                    : { receiverHasRead: true },
            });

            socketService.emitNotificationCount(
                userId,
                await notificationCount.getUnreadNotificationCount(userId),
            );
        }

        const base = {
            id: contactRequest.id,
            requesterId: contactRequest.requesterId,
            receiverId: contactRequest.receiverId,
            reason: contactRequest.reason,
            status: contactRequest.status,
            lastActivityAt: contactRequest.lastActivityAt,
            isRead: true,
        };

        // receiver sees pending
        if (contactRequest.status === 'PENDING') {
            return base;
        }

        // requester sees accepted
        if (!contactRequest.contactMethod) {
            throw new Error('CONTACT_METHOD_MISSING');
        }

        const decryptedContactInfo: string = this.contactUtils.decrypt(
            contactRequest.contactMethod.value,
        );

        return {
            ...base,
            contactMethod: {
                type: contactRequest.contactMethod.type,
                value: decryptedContactInfo,
            },
        };
    }
}

export default new ContactRequestService();
