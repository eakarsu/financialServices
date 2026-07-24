export function collectionFromResponse<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[]

  if (
    payload &&
    typeof payload === 'object' &&
    'data' in payload &&
    Array.isArray(payload.data)
  ) {
    return payload.data as T[]
  }

  return []
}
