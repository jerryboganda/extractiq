import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './password.js';

describe('hashPassword', () => {
  it('returns a bcrypt hash string', async () => {
    const hash = await hashPassword('TestPassword123!');
    expect(hash).toMatch(/^\$2[aby]?\$\d{2}\$/);
  });

  it('produces different hashes for the same password (random salt)', async () => {
    const hash1 = await hashPassword('SamePassword');
    const hash2 = await hashPassword('SamePassword');
    expect(hash1).not.toBe(hash2);
  });

  it('produces different hashes for different passwords', async () => {
    const hash1 = await hashPassword('Password1');
    const hash2 = await hashPassword('Password2');
    expect(hash1).not.toBe(hash2);
  });
});

describe('verifyPassword', () => {
  it('returns true for correct password', async () => {
    const hash = await hashPassword('CorrectPassword');
    const result = await verifyPassword('CorrectPassword', hash);
    expect(result).toBe(true);
  });

  it('returns false for incorrect password', async () => {
    const hash = await hashPassword('CorrectPassword');
    const result = await verifyPassword('WrongPassword', hash);
    expect(result).toBe(false);
  });

  it('handles empty password correctly', async () => {
    const hash = await hashPassword('SomePassword');
    const result = await verifyPassword('', hash);
    expect(result).toBe(false);
  });

  it('handles special characters in password', async () => {
    const password = 'P@$$w0rd!#%^&*()_+{}|';
    const hash = await hashPassword(password);
    const result = await verifyPassword(password, hash);
    expect(result).toBe(true);
  });

  it('handles unicode characters in password', async () => {
    const password = '密码テスト🔑';
    const hash = await hashPassword(password);
    const result = await verifyPassword(password, hash);
    expect(result).toBe(true);
  });
});
