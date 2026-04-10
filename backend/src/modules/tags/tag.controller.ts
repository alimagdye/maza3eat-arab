import { Request, Response } from 'express';
import TagService from './tag.service.js';

class TagController {
    private tagService = TagService;
    getTrendingTags = async (req: Request, res: Response) => {
        try {
            const limit = parseInt(req.query.limit as string) || 10;
            const trendingTags = await this.tagService.getTrendingTags(limit);
            return res.status(200).json({
                status: 'success',
                data: trendingTags,
            });
        } catch (error) {
            console.error('Error fetching trending tags:', error);

            return res.status(500).json({
                status: 'error',
                message: 'Failed to fetch trending tags',
            });
        }
    };

    getSuggestedTags = async (req: Request, res: Response) => {
        const { search } = req.query as { search: string };

        try {
            const suggestedTags = await this.tagService.suggestTags(search);
            res.status(200).json({
                status: 'success',
                data: suggestedTags,
            });
        } catch (error) {
            console.error('Error fetching suggested tags:', error);

            res.status(500).json({
                status: 'error',
                message: 'Failed to fetch suggested tags',
            });
        }
    };
}

export default new TagController();
