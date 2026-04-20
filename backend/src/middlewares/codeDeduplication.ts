import { Request, Response, NextFunction } from 'express';

interface ProcessedCode {
  code: string;
  timestamp: number;
}

class CodeDeduplicationMiddleware {
  private processedCodes: Map<string, ProcessedCode> = new Map();
  private readonly CODE_EXPIRY_MS = 60 * 1000; // 60 seconds

  /**
   * Middleware to prevent processing the same OAuth authorization code twice.
   * This creates a simple in-memory cache of recently processed codes.
   * Codes are automatically expired after CODE_EXPIRY_MS.
   */
  deduplicateOAuthCode = (req: Request, res: Response, next: NextFunction) => {
    const code = req.query.code as string;

    if (!code) {
      return next();
    }

    const now = Date.now();

    // Clean up expired codes
    for (const [key, value] of this.processedCodes.entries()) {
      if (now - value.timestamp > this.CODE_EXPIRY_MS) {
        this.processedCodes.delete(key);
      }
    }

    // Check if code was already processed recently
    if (this.processedCodes.has(code)) {
      console.warn(`[Auth] Duplicate OAuth code detected: ${code.substring(0, 10)}...`);
      return res.status(403).json({
        status: 'fail',
        message: 'Authorization code already processed',
      });
    }

    // Store this code as processed
    this.processedCodes.set(code, { code, timestamp: now });

    next();
  };
}

export default new CodeDeduplicationMiddleware();
