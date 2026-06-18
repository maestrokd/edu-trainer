export type PageableResponse<T> = {
  page: number;
  requestedSize: number;
  actualPageSize: number;
  totalItems: number;
  totalPages: number;
  items: T[];
};
