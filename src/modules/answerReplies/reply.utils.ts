class ReplyUtils {
    nextSegment(segment?: string) {
        if (!segment) return '1';

        const number = parseInt(segment, 36);

        return (number + 1).toString(36).toUpperCase();
    }
}

export default new ReplyUtils();
