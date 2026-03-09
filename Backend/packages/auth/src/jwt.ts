import jwt, { type JwtPayload } from 'jsonwebtoken';

export interface TokenPayload {
  sub: string; // userId
  wid: string; // workspaceId
  role: string; // UserRole value
  iat?: number;
  exp?: number;
}

/**
 * Sign a JWT access token.
 * - Algorithm: HS256
 * - Default expiry: 24 hours
 */
export function signToken(
  payload: Omit<TokenPayload, 'iat' | 'exp'>,
  secret: string,
  expiresIn: number = 86400, // 24 hours in seconds
): string {
  return jwt.sign(payload, secret, {
    algorithm: 'HS256',
    expiresIn,
  });
}

/**
 * Sign a refresh token with longer expiry.
 */
export function signRefreshToken(
  payload: Omit<TokenPayload, 'iat' | 'exp'>,
  secret: string,
  expiresIn: number = 604800, // 7 days in seconds
): string {
  return jwt.sign({ ...payload, type: 'refresh' }, secret, {
    algorithm: 'HS256',
    expiresIn,
  });
}

/**
 * Verify and decode a JWT. Throws on invalid/expired tokens.
 */
export function verifyToken(token: string, secret: string): TokenPayload {
  const decoded = jwt.verify(token, secret, {
    algorithms: ['HS256'],
  }) as JwtPayload;

  return {
    sub: decoded.sub as string,
    wid: decoded.wid as string,
    role: decoded.role as string,
    iat: decoded.iat,
    exp: decoded.exp,
  };
}

/**
 * Decode a JWT WITHOUT verifying its signature.
 * Only use for logging/debugging — never for auth decisions.
 */
export function decodeToken(token: string): TokenPayload | null {
  const decoded = jwt.decode(token) as JwtPayload | null;
  if (!decoded) return null;

  return {
    sub: decoded.sub as string,
    wid: decoded.wid as string,
    role: decoded.role as string,
    iat: decoded.iat,
    exp: decoded.exp,
  };
}
