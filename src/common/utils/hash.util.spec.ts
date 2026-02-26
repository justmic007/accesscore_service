import { hashPassword, comparePassword, hashApiKey, compareApiKey } from './hash.util';

describe('HashUtil', () => {
    describe('hashPassword', () => {
        it('should hash password', async () => {
            const password = 'Password123!';
            const hashed = await hashPassword(password);

            expect(hashed).toBeDefined();
            expect(hashed).not.toBe(password);
            expect(hashed).toMatch(/^\$2[aby]\$/);
        });

        it('should generate different hashes for same password', async () => {
            const password = 'Password123!';
            const hash1 = await hashPassword(password);
            const hash2 = await hashPassword(password);

            expect(hash1).not.toBe(hash2);
        });
    });

    describe('comparePassword', () => {
        it('should return true for matching password', async () => {
            const password = 'Password123!';
            const hashed = await hashPassword(password);

            const result = await comparePassword(password, hashed);

            expect(result).toBe(true);
        });

        it('should return false for non-matching password', async () => {
            const password = 'Password123!';
            const wrongPassword = 'WrongPassword';
            const hashed = await hashPassword(password);

            const result = await comparePassword(wrongPassword, hashed);

            expect(result).toBe(false);
        });
    });

    describe('hashApiKey', () => {
        it('should hash API key', async () => {
            const apiKey = 'ak_live_test123456';
            const hashed = await hashApiKey(apiKey);

            expect(hashed).toBeDefined();
            expect(hashed).not.toBe(apiKey);
            expect(hashed).toMatch(/^\$2[aby]\$/);
        });
    });

    describe('compareApiKey', () => {
        it('should return true for matching API key', async () => {
            const apiKey = 'ak_live_test123456';
            const hashed = await hashApiKey(apiKey);

            const result = await compareApiKey(apiKey, hashed);

            expect(result).toBe(true);
        });

        it('should return false for non-matching API key', async () => {
            const apiKey = 'ak_live_test123456';
            const wrongKey = 'ak_live_wrong123456';
            const hashed = await hashApiKey(apiKey);

            const result = await compareApiKey(wrongKey, hashed);

            expect(result).toBe(false);
        });
    });
});
