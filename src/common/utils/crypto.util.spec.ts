import { generateApiKey } from './crypto.util';
import { API_KEY_PREFIX } from '../constants/limits.constant';

describe('CryptoUtil', () => {
    describe('generateApiKey', () => {
        it('should generate API key with correct prefix', () => {
            const result = generateApiKey();

            expect(result.key).toMatch(new RegExp(`^${API_KEY_PREFIX}`));
            expect(result.prefix).toMatch(new RegExp(`^${API_KEY_PREFIX}`));
        });

        it('should generate unique keys', () => {
            const key1 = generateApiKey();
            const key2 = generateApiKey();

            expect(key1.key).not.toBe(key2.key);
            expect(key1.prefix).not.toBe(key2.prefix);
        });

        it('should generate prefix of correct length', () => {
            const result = generateApiKey();
            const expectedPrefixLength = API_KEY_PREFIX.length + 8;

            expect(result.prefix.length).toBe(expectedPrefixLength);
        });

        it('should generate key longer than prefix', () => {
            const result = generateApiKey();

            expect(result.key.length).toBeGreaterThan(result.prefix.length);
        });
    });
});
