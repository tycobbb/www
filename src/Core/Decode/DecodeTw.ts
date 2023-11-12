import { Tw } from "../Tw/mod.ts"

// -- impls --
export function decodeTw(text: string): unknown {
  return new Tw().decode(text)
}