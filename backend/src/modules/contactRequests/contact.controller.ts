import { Request, Response } from 'express';
import ContactRequestService from './contact.service.js';

class ContactRequestController {
    private contactRequestService = ContactRequestService;

    createContactRequest = async (req: Request, res: Response) => {
        const requesterId = req.user.sub as string;
        const receiverId = req.body.receiverId as string;
        const reason = req.body.reason as string;

        try {
            const contactRequest =
                await this.contactRequestService.createContactRequest(
                    requesterId,
                    receiverId,
                    reason,
                );

            return res.status(200).json({
                status: 'success',
                data: contactRequest,
            });
        } catch (error: any) {
            console.error(error);

            // cooldown error
            if (error?.code === 'COOLDOWN') {
                return res.status(429).json({
                    status: 'fail',
                    message: 'You can send another request later',
                    nextAvailableAt: error.nextAvailableAt,
                });
            }

            // self-contact
            if (error?.message === 'Cannot contact yourself') {
                return res.status(400).json({
                    status: 'fail',
                    message: error.message,
                });
            }

            return res.status(500).json({
                status: 'error',
                message: 'Failed to create contact request',
            });
        }
    };

    getContactRequests = async (req: Request, res: Response) => {
        const userId = req.user.sub as string;
        const cursor = req.query.cursor as string | null;
        try {
            const contactRequests =
                await this.contactRequestService.getContactRequests(
                    userId,
                    cursor,
                );
            res.status(200).json({
                status: 'success',
                data: contactRequests,
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: 'Failed to fetch contact requests',
            });
        }
    };

    respondToContactRequest = async (req: Request, res: Response) => {
        const contactRequestId = req.params.id as string;
        const receiverId = req.user.sub as string;
        const status = req.body.status as 'ACCEPTED' | 'DECLINED';
        const type = req.body.type;
        const contactInfo = req.body.contactInfo as string | undefined;
        try {
            const contactRequest =
                await this.contactRequestService.updateContactRequest(
                    contactRequestId,
                    receiverId,
                    status,
                    type,
                    contactInfo,
                );
            res.status(200).json({
                status: 'success',
                data: contactRequest,
            });
        } catch (error: any) {
            console.error(error);

            if (error?.message === 'NOT_FOUND') {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Contact request not found.',
                });
            }

            if (error?.message === 'ALREADY_RESPONDED') {
                return res.status(400).json({
                    status: 'fail',
                    message:
                        'This contact request has already been responded to.',
                });
            }

            // Invalid contact info format
            if (error?.message === 'INVALID_CONTACT_INFO_FORMAT') {
                return res.status(422).json({
                    status: 'fail',
                    message: 'Invalid contact info format',
                });
            }

            // Missing contact info
            if (error?.message === 'MISSING_CONTACT_INFO') {
                return res.status(422).json({
                    status: 'fail',
                    message:
                        'Contact info and type are required when accepting a contact request',
                });
            }

            // Failed to decrypt contact data
            if (error?.message === 'ENCRYPTION_FAILED') {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Failed to encrypt contact data.',
                });
            }

            res.status(500).json({
                status: 'error',
                message: 'Failed to update contact request',
            });
        }
    };

    getContactRequestById = async (req: Request, res: Response) => {
        const userId = req.user.sub as string;
        const contactRequestId = req.params.id as string;
        try {
            const contactRequest =
                await this.contactRequestService.getContactRequestById(
                    userId,
                    contactRequestId,
                );
            res.status(200).json({
                status: 'success',
                data: contactRequest,
            });
        } catch (error: any) {
            console.error(error);

            if (error?.message === 'NOT_FOUND') {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Contact request not found.',
                });
            }

            if (error?.message === 'FAILED_TO_DECRYPT_CONTACT_DATA') {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Failed to decrypt contact data.',
                });
            }

            // Invalid encrypted payload
            if (error?.message === 'INVALID_ENCRYPTED_PAYLOAD') {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Invalid encrypted contact data.',
                });
            }

            // Missing contact info
            if (error?.message === 'CONTACT_METHOD_MISSING') {
                return res.status(422).json({
                    status: 'fail',
                    message:
                        'Contact info and type are required when accepting a contact request',
                });
            }

            res.status(500).json({
                status: 'error',
                message: 'Failed to fetch contact request',
            });
        }
    };
}

export default new ContactRequestController();
