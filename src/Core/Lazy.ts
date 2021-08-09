export function lazy<T>(builder: () => T): () => T {
  let value: T | null = null

  return () => {
    if (value == null) {
      value = builder()
    }

    return value
  }
}
