export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export const DEFAULT_PAGE_SIZE = 10;

export function buildPagination(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  const safeLimit = limit > 0 ? limit : DEFAULT_PAGE_SIZE;
  const total_pages = total > 0 ? Math.ceil(total / safeLimit) : 1;
  return {
    page: page > 0 ? page : 1,
    limit: safeLimit,
    total,
    total_pages: Math.max(total_pages, 1),
  };
}

export function paginationFromListResponse(data?: {
  total?: number;
  page?: number;
  limit?: number;
}): PaginationMeta | undefined {
  if (!data || data.total === undefined) return undefined;
  return buildPagination(data.total, data.page ?? 1, data.limit ?? DEFAULT_PAGE_SIZE);
}
