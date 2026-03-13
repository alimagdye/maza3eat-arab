export function normalizeArabic(text: string): string {
    if (!text) return '';

    return text
        .toLowerCase()
        .replace(/[\u064B-\u065F\u0670ـ]/g, '')
        .replace(/[^a-z0-9\u0600-\u06FF\s]/g, '')
        .replace(/(^|\s)ال(?=[\u0600-\u06FF])/gu, '$1')
        .replace(/[أإآٱ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/ؤ/g, 'و')
        .replace(/ئ/g, 'ي')
        .replace(/ء/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}