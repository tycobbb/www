import { Parser, } from "./Parsers.ts"
import {
  map,
  pattern,
} from "./Parsers.ts"

// -- constants --
const k = {
  // a string "|'|` string that may have escapes
  string: /^("(\\"|[^"])*"|'(\\'|[^'])*'|`(\\`|[^`])*`)/
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

// str namespace
str.quoted = quoted