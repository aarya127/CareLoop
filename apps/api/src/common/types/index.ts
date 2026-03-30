// Shared NestJS-layer types
export interface PaginatedResult<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface RequestWithUser {
  user: { id: string; email: string; role: string; sessionId?: string };
}
