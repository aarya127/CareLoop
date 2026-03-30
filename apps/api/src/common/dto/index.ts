// Shared DTOs
export class PaginationDto {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class IdParamDto {
  id!: string;
}
