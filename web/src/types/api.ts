export interface ApiErrorResponse {
  success?: false
  message?: string
  errors?: Record<string, string[]>
}

export interface ApiSuccessResponse<TData> {
  success: true
  message: string
  data: TData
}

export interface ApiPaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface ApiPaginationLinks {
  first: string | null
  last: string | null
  prev: string | null
  next: string | null
}

export interface ApiPaginatedResponse<TData> extends ApiSuccessResponse<TData[]> {
  meta: ApiPaginationMeta
  links: ApiPaginationLinks
}
