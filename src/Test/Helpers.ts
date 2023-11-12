// -- constants --
const k = {
  whitespace: /\s*/g
}

// -- impls --
// removes all whitespace
export function scrub(text: string): string {
  return clean(k.whitespace, text)
}

// trim & remove extra tabs
export function undent(text: string): string {
  const tab = text.match(/^\n( +)/)?.at(1)?.length ?? 0

  let res = text
  res = res.trim()
  res = res.replace(new RegExp(`^ {${tab}}`, "gm"), "")

  return res
}

// removes the specified pattern from the string
export function clean(pattern: RegExp, text: string): string {
  return text.replaceAll(pattern, "")
}
