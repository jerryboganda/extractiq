/**
 * PII masking utilities for structured logging.
 * Ensures sensitive data never appears in plaintext in logs.
 */

/** Mask email: show first 2 chars + domain */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***@***';
  const masked = local.slice(0, 2) + '***';
  return `${masked}@${domain}`;
}

/** Mask IP address: hash-style partial mask */
export function maskIp(ip: string): string {
  if (ip.includes(':')) {
    // IPv6: show first segment only
    return ip.split(':')[0] + ':****';
  }
  // IPv4: show first two octets
  const parts = ip.split('.');
  return `${parts[0]}.${parts[1]}.*.*`;
}

/** Mask API key: show first 4 chars + masked rest */
export function maskApiKey(key: string): string {
  if (key.length <= 4) return '****';
  return key.slice(0, 4) + '****' + key.slice(-4);
}

/** Mask generic string: show first n chars */
export function maskString(value: string, showChars = 2): string {
  if (value.length <= showChars) return '***';
  return value.slice(0, showChars) + '***';
}
