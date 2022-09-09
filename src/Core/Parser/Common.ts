import { Parser } from "./Parsers.ts"
import {
  pattern,
} from "./Parsers.ts"

// -- constants --
const k = {
  // a whitespace pattern
  wspace: /^\s*/,
  // a string "|'|` string that may have escapes
  string: /^("(\\"|[^"])*"|'(\\'|[^'])*'|`(\\`|[^`])*`)/
}

// -- impls --
// a parser for repeated whitespace
export function whitespace(): Parser<string> {
  return pattern(k.wspace)
}

// a parser for a string value
export function string(): Parser<string> {
  return pattern(k.string)
}