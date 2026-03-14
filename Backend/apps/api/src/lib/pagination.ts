/**
 * Parse pagination query parameters with safe defaults.
 */
export function parsePagination(query: Record<string, unknown>): { page: number; limit: number; offset: number } {
  const page = Math.max(1, Math.floor(Number(query.page) || 1));
  const limit = Math.min(100, Math.max(1, Math.floor(Number(query.limit) || 20)));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}
