declare global {
    namespace Express {
        interface User {
            id: string;
            email: string;
            role: import('./index').UserRole;
        }
        interface Request {
            user?: User;
        }
    }
}
export {};
//# sourceMappingURL=express.d%202.d.ts.map