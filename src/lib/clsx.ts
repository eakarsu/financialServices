export type ClassValue = string | number | boolean | undefined | null | ClassValue[] | { [key: string]: unknown }

export function clsx(...inputs: ClassValue[]): string {
  let result = ''

  for (const input of inputs) {
    if (!input) continue

    if (typeof input === 'string' || typeof input === 'number') {
      result += (result ? ' ' : '') + input
    } else if (Array.isArray(input)) {
      const inner = clsx(...input)
      if (inner) {
        result += (result ? ' ' : '') + inner
      }
    } else if (typeof input === 'object') {
      for (const key in input) {
        if (input[key]) {
          result += (result ? ' ' : '') + key
        }
      }
    }
  }

  return result
}

export default clsx
