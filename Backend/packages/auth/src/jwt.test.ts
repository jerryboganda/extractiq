import { describe, it, expect } from 'vitest';
import { signToken, signRefreshToken, verifyToken, decodeToken, type TokenPayload } from './jwt.js';

const TEST_SECRET = 'a-very-long-test-secret-that-is-at-least-32-chars';

const samplePayload: Omit<TokenPayload, 'iat' | 'exp'> = {
  sub: 'user-123',
  wid: 'workspace-456',
  role: 'operator',
};

describe('signToken', () => {
  it('returns a JWT string', () => {
    const token = signToken(samplePayload, TEST_SECRET);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('produces tokens that can be verified', () => {
    const token = signToken(samplePayload, TEST_SECRET);
    const decoded = verifyToken(token, TEST_SECRET);
    expect(decoded.sub).toBe('user-123');
    expect(decoded.wid).toBe('workspace-456');
    expect(decoded.role).toBe('operator');
  });

  it('respects custom expiresIn', () => {
    const token = signToken(samplePayload, TEST_SECRET, 60); // 60 seconds
    const decoded = verifyToken(token, TEST_SECRET);
    expect(decoded.exp! - decoded.iat!).toBe(60);
  });

  it('defaults to 24h expiry', () => {
    const token = signToken(samplePayload, TEST_SECRET);
    const decoded = verifyToken(token, TEST_SECRET);
    expect(decoded.exp! - decoded.iat!).toBe(86400);
  });
});

describe('signRefreshToken', () => {
  it('produces a verifiable refresh token', () => {
    const token = signRefreshToken(samplePayload, TEST_SECRET);
    const decoded = verifyToken(token, TEST_SECRET);
    expect(decoded.sub).toBe('user-123');
  });

  it('defaults to 7-day expiry', () => {
    const token = signRefreshToken(samplePayload, TEST_SECRET);
    const decoded = verifyToken(token, TEST_SECRET);
    expect(decoded.exp! - decoded.iat!).toBe(604800);
  });

  it('respects custom expiresIn', () => {
    const token = signRefreshToken(samplePayload, TEST_SECRET, 3600);
    const decoded = verifyToken(token, TEST_SECRET);
    expect(decoded.exp! - decoded.iat!).toBe(3600);
  });
});

describe('verifyToken', () => {
  it('returns the correct payload fields', () => {
    const token = signToken(samplePayload, TEST_SECRET);
    const decoded = verifyToken(token, TEST_SECRET);
    expect(decoded).toMatchObject({
      sub: 'user-123',
      wid: 'workspace-456',
      role: 'operator',
    });
    expect(decoded.iat).toBeTypeOf('number');
    expect(decoded.exp).toBeTypeOf('number');
  });

  it('throws on wrong secret', () => {
    const token = signToken(samplePayload, TEST_SECRET);
    expect(() => verifyToken(token, 'wrong-secret-that-is-also-long-enough')).toThrow();
  });

  it('throws on tampered token', () => {
    const token = signToken(samplePayload, TEST_SECRET);
    const tampered = token.slice(0, -5) + 'XXXXX';
    expect(() => verifyToken(tampered, TEST_SECRET)).toThrow();
  });

  it('throws on expired token', () => {
    const token = signToken(samplePayload, TEST_SECRET, -1);
    expect(() => verifyToken(token, TEST_SECRET)).toThrow();
  });

  it('throws on malformed token', () => {
    expect(() => verifyToken('not-a-jwt', TEST_SECRET)).toThrow();
    expect(() => verifyToken('', TEST_SECRET)).toThrow();
  });
});

describe('decodeToken', () => {
  it('decodes without verifying signature', () => {
    const token = signToken(samplePayload, TEST_SECRET);
    const decoded = decodeToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded!.sub).toBe('user-123');
    expect(decoded!.wid).toBe('workspace-456');
    expect(decoded!.role).toBe('operator');
  });

  it('decodes even with wrong secret (no verification)', () => {
    const token = signToken(samplePayload, TEST_SECRET);
    // decodeToken does NOT verify, so this should still work
    const decoded = decodeToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded!.sub).toBe('user-123');
  });

  it('returns null for invalid strings', () => {
    expect(decodeToken('not-a-jwt')).toBeNull();
    expect(decodeToken('')).toBeNull();
  });
});
