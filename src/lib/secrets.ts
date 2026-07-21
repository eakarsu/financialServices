export function requireSecret(name: string, minimumLength = 32): string {
  const value = process.env[name]
  if (!value || value.length < minimumLength) {
    throw new Error(`${name} must be configured with at least ${minimumLength} characters`)
  }
  return value
}

export function requireConfig(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} must be configured`)
  return value
}
