import crypto from 'node:crypto';
import { env } from '@mcq-platform/config';

const CURRENT_VERSION = 'v1';

function getKey(): Buffer {
  return Buffer.from(env.ENCRYPTION_KEY, 'hex');
}

export function encryptProviderSecret(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    CURRENT_VERSION,
    iv.toString('hex'),
    authTag.toString('hex'),
    encrypted.toString('hex'),
  ].join(':');
}

function decryptV1(parts: string[]): string {
  const [, ivHex, authTagHex, cipherTextHex] = parts;
  if (!ivHex || !authTagHex || !cipherTextHex) {
    throw new Error('Invalid encrypted provider secret');
  }

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getKey(),
    Buffer.from(ivHex, 'hex'),
  );
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

  let decrypted = decipher.update(Buffer.from(cipherTextHex, 'hex'), undefined, 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

function decryptLegacyBase64(ciphertext: string): string {
  const payload = Buffer.from(ciphertext, 'base64');
  const iv = payload.subarray(0, 12);
  const authTag = payload.subarray(12, 28);
  const encrypted = payload.subarray(28);

  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), iv);
  decipher.setAuthTag(authTag);

  return decipher.update(encrypted) + decipher.final('utf8');
}

export function decryptProviderSecret(ciphertext: string): string {
  if (ciphertext.startsWith(`${CURRENT_VERSION}:`)) {
    return decryptV1(ciphertext.split(':'));
  }

  return decryptLegacyBase64(ciphertext);
}

export function isLegacyProviderSecret(ciphertext: string): boolean {
  return !ciphertext.startsWith(`${CURRENT_VERSION}:`);
}
