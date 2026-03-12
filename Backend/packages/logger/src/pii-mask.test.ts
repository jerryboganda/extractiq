import { describe, it, expect } from 'vitest';
import { maskEmail, maskIp, maskApiKey, maskString } from './pii-mask.js';

describe('maskEmail', () => {
  it('masks email keeping first 2 chars and domain', () => {
    expect(maskEmail('john@example.com')).toBe('jo***@example.com');
  });

  it('handles short local parts', () => {
    expect(maskEmail('ab@test.com')).toBe('ab***@test.com');
  });

  it('handles missing @ sign', () => {
    expect(maskEmail('notanemail')).toBe('***@***');
  });

  it('handles single-char local part', () => {
    expect(maskEmail('a@test.com')).toBe('a***@test.com');
  });
});

describe('maskIp', () => {
  it('masks IPv4 showing first two octets', () => {
    expect(maskIp('192.168.1.100')).toBe('192.168.*.*');
  });

  it('masks IPv6 showing first segment', () => {
    expect(maskIp('2001:db8:85a3::8a2e:370:7334')).toBe('2001:****');
  });
});

describe('maskApiKey', () => {
  it('masks API key showing first and last 4 chars', () => {
    expect(maskApiKey('sk-test-12345678-abcdef')).toBe('sk-t****cdef');
  });

  it('masks short keys entirely', () => {
    expect(maskApiKey('abcd')).toBe('****');
  });

  it('masks keys with exactly 4 chars', () => {
    expect(maskApiKey('test')).toBe('****');
  });

  it('handles longer keys', () => {
    const key = 'sk-proj-abc123xyz789';
    const masked = maskApiKey(key);
    expect(masked).toMatch(/^sk-p\*{4}.{4}$/);
  });
});

describe('maskString', () => {
  it('masks showing first 2 chars by default', () => {
    expect(maskString('sensitive-data')).toBe('se***');
  });

  it('respects custom showChars', () => {
    expect(maskString('sensitive-data', 4)).toBe('sens***');
  });

  it('handles short strings', () => {
    expect(maskString('ab')).toBe('***');
    expect(maskString('a')).toBe('***');
  });
});
