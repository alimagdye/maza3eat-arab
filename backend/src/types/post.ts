export enum HomeScope {
    COMMUNITY = 'COMMUNITY',
    ADMIN = 'ADMIN',
}
export type HomeScopeType = 'community' | 'admin';

type FormattedHomePost = {
    id: string;
    title: string;
    content: string;
    likesCount: number;
    commentsCount: number;
    tags: { name: string }[];
    image: { url: string; name: string };
    author: {
        name: string;
        avatar: string;
        tierName: string | null;
        badgeColor: string | null;
    };
};

export type ScopeCacheState = {
    data: FormattedHomePost[];
    expiresAt: number;
    refreshPromise: Promise<void> | null;
};
