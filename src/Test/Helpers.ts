// -- constants --
const k = {
  whitespace: /\s*/g
}

// -- impls --
// removes all whitespace
export function scrub(text: string): string {
  return clean(k.whitespace, text)
}

/// removes the specified pattern from the string
export function clean(pattern: RegExp, text: string): string {
  return text.replaceAll(pattern, "")
}