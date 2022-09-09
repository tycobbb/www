import { Parser, } from "./Parsers.ts"
import { pattern, } from "./Parsers.ts"

// -- constants --
const k = {
  // a whitespace pattern
  wspace: /^\s*/,
}

// -- impls --
// a parser for repeated whitespace
export function whitespace(): Parser<string> {
  return pattern(k.wspace)
}
