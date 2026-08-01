class ReplyUtils {
    nextSegment(segment?: string) {
        const WIDTH = 6;

        const next = segment ? parseInt(segment, 36) + 1 : 1;

        return next.toString(36).toUpperCase().padStart(WIDTH, '0');
    }
}

export default new ReplyUtils();
