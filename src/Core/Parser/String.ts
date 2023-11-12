import { Parser } from "./Parser.ts"
import { map, pattern } from "./Parsers.ts"

// -- constants --
const k = {
  // a string "|'|` string that may have escapes
  string: /^("(\\"|[^"])*"|'(\\'|[^'])*'|`(\\`|[^`])*`)/,
  // a whitespace pattern
  wspace: /^\s*/,
}

// -- impls --
// a parser for the contents of a quoted string
export function str(): Parser<string> {
  return map(
    quoted(),
    (s) => s.slice(1, -1),
  )
}

// a parser for a quoted string
export function quoted(): Parser<string> {
  return pattern(k.string)
}

// a parser for repeated whitespace
export function whitespace(): Parser<string> {
  return pattern(k.wspace)
}


// str namespace
str.quoted = quoted