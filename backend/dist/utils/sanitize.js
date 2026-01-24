"use strict";
/**
 * Input sanitization utility to prevent XSS attacks
 * Removes HTML tags and sanitizes user input
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeObject = exports.sanitizeString = void 0;
// Simple HTML tag removal (lightweight alternative to DOMPurify)
const sanitizeString = (input) => {
    if (typeof input !== 'string')
        return input;
    // Remove HTML tags
    let sanitized = input.replace(/<[^>]*>/g, '');
    // Decode HTML entities
    sanitized = sanitized
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, '/');
    // Trim whitespace
    return sanitized.trim();
};
exports.sanitizeString = sanitizeString;
const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object')
        return obj;
    const sanitized = { ...obj };
    for (const key in sanitized) {
        if (typeof sanitized[key] === 'string') {
            sanitized[key] = (0, exports.sanitizeString)(sanitized[key]);
        }
        else if (typeof sanitized[key] === 'object' && sanitized[key] !== null && !Array.isArray(sanitized[key])) {
            sanitized[key] = (0, exports.sanitizeObject)(sanitized[key]);
        }
        else if (Array.isArray(sanitized[key])) {
            sanitized[key] = sanitized[key].map((item) => typeof item === 'string' ? (0, exports.sanitizeString)(item) :
                typeof item === 'object' && item !== null ? (0, exports.sanitizeObject)(item) :
                    item);
        }
    }
    return sanitized;
};
exports.sanitizeObject = sanitizeObject;
//# sourceMappingURL=sanitize.js.map