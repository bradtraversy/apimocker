import { createHash, randomBytes, timingSafeEqual } from 'crypto';

const API_KEY_PREFIX = 'am_env_';
const MANAGEMENT_KEY_PREFIX = 'am_mgmt_';

export const generateApiKey = () =>
  `${API_KEY_PREFIX}${randomBytes(24).toString('base64url')}`;

export const generateManagementKey = () =>
  `${MANAGEMENT_KEY_PREFIX}${randomBytes(24).toString('base64url')}`;

export const hashApiKey = (apiKey: string) =>
  createHash('sha256').update(apiKey).digest('hex');

export const apiKeyMatches = (apiKey: string, expectedHash: string) => {
  const actual = Buffer.from(hashApiKey(apiKey), 'hex');
  const expected = Buffer.from(expectedHash, 'hex');

  return actual.length === expected.length && timingSafeEqual(actual, expected);
};
