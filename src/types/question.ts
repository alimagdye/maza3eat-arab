export type FormattedHomeQuestion = {
    id: string;
    title: string;
    content: string;
    likesCount: number;
    answersCount: number;
    tags: { name: string }[];
    author: {
        name: string;
        avatar: string | null;
        tierName: string | null;
        badgeColor: string | null;
    };
    topAnswer: {
        id: string;
        content: string;
        totalVoteValue: number;
        author: {
            name: string;
            avatar: string | null;
            tier: {
                name: string;
                badgeColor: string | null;
            } | null;
        };
    } | null;
};

export type PopularQuestion = {
    id: string;
    title: string;
    answersCount: number;
};