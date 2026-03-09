import type { Request } from 'express';

/**
 * Safely extract a route param as a string.
 * Express ParamsDictionary types params as `string | string[]`,
 * but named route params (/:id) are always strings at runtime.
 */
export function param(req: Request, name: string): string {
  const value = req.params[name];
  if (Array.isArray(value)) return value[0]!;
  return value as string;
}
