// -- constants --
// matches all whitespace
const kWhitespacePattern = /\s*/g

// -- impls --
// removes all whitespace
export function clean(text: string): string {
  return text.replaceAll(kWhitespacePattern, "")
}