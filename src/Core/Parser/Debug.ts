import { Parser } from "./Parsers.ts"

// -- impls --
// a debug helper
export function debug<A>(
  p1: Parser<A>
): Parser<A> {
  return (input) => {
    return p1(input)
  }
}