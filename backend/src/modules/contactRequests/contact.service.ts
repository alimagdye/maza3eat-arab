import { prisma } from '../../lib/client.js';
import ContactUtils from './contact.utils.js';
import { ContactMethod } from '../../types/contact.js';

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

        return await prisma.$transaction(async (tx) => {
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
                };
            }

            return {
                id: request.id,
                requester: request.requester,
                receiver: 'YOU',
                lastActivityAt: request.lastActivityAt,
                type: 'RECEIVED:PENDING',
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

        return await prisma.$transaction(async (tx) => {
            const contactRequest = await tx.contactRequest.findUnique({
                where: { id: contactRequestId },
                select: { receiverId: true, status: true },
            });

            if (!contactRequest || contactRequest.receiverId !== receiverId) {
                // Contact request not found
                throw new Error('NOT_FOUND');
            }

            if (contactRequest.status !== 'PENDING') {
                // Contact request already responded to
                throw new Error('ALREADY_RESPONDED');
            }

            if (status === 'DECLINED') {
                const updatedRequest = await tx.contactRequest.update({
                    where: { id: contactRequestId },
                    data: {
                        status,
                        lastActivityAt: now,
                    },
                });

                return {
                    status: updatedRequest.status,
                    lastActivityAt: updatedRequest.lastActivityAt,
                };
            }

            if (status === 'ACCEPTED') {
                if (!contactInfo || !type) {
                    // Contact info and type are required
                    throw new Error('MISSING_CONTACT_INFO');
                }

                const normalized = this.contactUtils.normalizeContact(
                    type,
                    contactInfo,
                );

                // validate
                if (!this.contactUtils.validateContact(type, normalized)) {
                    // Invalid contact info format
                    throw new Error('INVALID_CONTACT_INFO_FORMAT');
                }

                // encrypt
                const encrypted = this.contactUtils.encrypt(normalized);

                const updatedRequest = await tx.contactRequest.update({
                    where: { id: contactRequestId },
                    data: {
                        status,
                        lastActivityAt: now,
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
                    status: updatedRequest.status,
                    lastActivityAt: updatedRequest.lastActivityAt,
                };
            }
        });
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

        // if received:pending
        const base = {
            id: contactRequest.id,
            requesterId: contactRequest.requesterId,
            receiverId: contactRequest.receiverId,
            reason: contactRequest.reason,
            status: contactRequest.status,
            lastActivityAt: contactRequest.lastActivityAt,
        };

        if (contactRequest.status === 'PENDING') {
            return base;
        }

        // if sent:accepted
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
