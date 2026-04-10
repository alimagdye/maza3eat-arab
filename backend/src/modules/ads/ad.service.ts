import { prisma } from '../../lib/client.js';
import { CachedAd } from '../../types/ad.js';
import { FormattedHomeAd } from '../../types/ad.js';

class AdService {
    // --- POST ADS STATE ---
    private cachedAds: CachedAd[] = [];
    private totalWeight = 0;
    private cacheExpiresAt = 0;
    private refreshPromise: Promise<void> | null = null;
    private readonly BASE_TTL = 1000 * 60 * 2; // 2 minutes

    // --- HOME ADS STATE ---
    private cachedHomeAds: FormattedHomeAd[] = [];
    private homeAdsCacheExpiresAt = 0;
    private homeAdsRefreshPromise: Promise<void> | null = null;
    private readonly HOME_ADS_TTL = 1000 * 60 * 60; // 1 Hour (Since they rarely change)

    // ==========================================
    // POST ADS LOGIC
    // ==========================================
    private async refreshCache() {
        const nowDate = new Date();

        const ads = await prisma.ad.findMany({
            where: {
                isActive: true,
                expireAt: { gt: nowDate },
            },
            select: {
                id: true,
                priority: true,
                title: true,
                text: true,
                imageUrl: true,
                imageName: true,
                link: true,
                buttonText: true,
            },
        });

        this.cachedAds = ads.map((ad) => ({
            id: ad.id,
            weight: Math.max(0, ad.priority),
            title: ad.title,
            text: ad.text,
            image: {
                url: ad.imageUrl,
                name: ad.imageName,
            },
            link: ad.link,
            buttonText: ad.buttonText,
        }));

        this.totalWeight = 0;
        for (const ad of this.cachedAds) this.totalWeight += ad.weight;

        const jitter = Math.floor(Math.random() * 1000 * 30);
        this.cacheExpiresAt = Date.now() + this.BASE_TTL + jitter;
    }

    public invalidateAdCache() {
        this.cacheExpiresAt = 0;
    }

    public async getPostAd() {
        const now = Date.now();

        if (now > this.cacheExpiresAt) {
            if (!this.refreshPromise) {
                this.refreshPromise = this.refreshCache()
                    .catch((e) => console.error('Ad cache refresh failed:', e))
                    .finally(() => (this.refreshPromise = null));
            }

            if (this.cachedAds.length === 0) {
                await this.refreshPromise;
            }
        }

        if (this.cachedAds.length === 0) return null;

        if (this.totalWeight <= 0) {
            return this.cachedAds[
                Math.floor(Math.random() * this.cachedAds.length)
            ];
        }

        let r = Math.random() * this.totalWeight;

        for (const ad of this.cachedAds) {
            r -= ad.weight;
            if (r < 0) return ad;
        }

        return this.cachedAds[this.cachedAds.length - 1];
    }

    // ==========================================
    // HOME ADS LOGIC
    // ==========================================
    private async refreshHomeAdsCache() {
        const rawHomeAds = await prisma.homeAd.findMany({
            orderBy: { position: 'asc' },
            include: { ad: true },
        });

        this.cachedHomeAds = rawHomeAds.map((homeAd) => ({
            id: homeAd.ad.id,
            position: homeAd.position.toLowerCase(),
            title: homeAd.ad.title,
            text: homeAd.ad.text,
            link: homeAd.ad.link,
            buttonText: homeAd.ad.buttonText,
            image: {
                url: homeAd.ad.imageUrl,
                name: homeAd.ad.imageName,
            },
        }));

        // 1 Hour TTL + up to 5 minutes of jitter
        const jitter = Math.floor(Math.random() * 1000 * 60 * 5);
        this.homeAdsCacheExpiresAt = Date.now() + this.HOME_ADS_TTL + jitter;
    }

    public invalidateHomeAdsCache() {
        this.homeAdsCacheExpiresAt = 0;
    }

    public async getHomeAds() {
        const now = Date.now();

        if (now > this.homeAdsCacheExpiresAt) {
            if (!this.homeAdsRefreshPromise) {
                this.homeAdsRefreshPromise = this.refreshHomeAdsCache()
                    .catch((e) =>
                        console.error('Home ad cache refresh failed:', e),
                    )
                    .finally(() => (this.homeAdsRefreshPromise = null));
            }

            // Cold start: Only block if we have nothing to show yet
            if (this.cachedHomeAds.length === 0) {
                await this.homeAdsRefreshPromise;
            }
        }

        return {
            ads: this.cachedHomeAds,
        };
    }
}

// Export as Singleton
export default new AdService();
