export type CachedAd = {
    id: string;
    weight: number;
    title: string;
    text: string;
    image: {
        url: string;
        name: string;
    };
    link: string;
    buttonText: string;
};

export type FormattedHomeAd = {
    id: string;
    position: string;
    title: string;
    text: string;
    link: string;
    buttonText: string;
    image: {
        url: string;
        name: string;
    };
};
