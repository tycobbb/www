// -- impls --
export function decodeJson(text: string): unknown {
  return JSON.parse(text)
}