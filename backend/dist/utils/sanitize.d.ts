/**
 * Input sanitization utility to prevent XSS attacks
 * Removes HTML tags and sanitizes user input
 */
export declare const sanitizeString: (input: string) => string;
export declare const sanitizeObject: <T extends Record<string, any>>(obj: T) => T;
//# sourceMappingURL=sanitize.d.ts.map