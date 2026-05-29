export type ApiResponse<T> =
  | { data: T; success: true }
  | { error: string; success: false };

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
