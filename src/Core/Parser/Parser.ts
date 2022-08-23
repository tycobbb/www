// goal:
// <w-frag
//   path="./post"
//   i=5
// />

// -- types --
// a string slice
export type Slice
  = string

// the status of a parser result
export enum ParserStatus {
  success,
  failure
}

// alias for status
import PS = ParserStatus

// the result of any parser
export type ParserResult<V>
  = { stat: PS.success, slice: Slice, value: V }
  | { stat: PS.failure, slice: Slice }

// a parser that may parse a slice
export type Parser<V>
  = (str: Slice) => ParserResult<V>

// -- constants --
const kIdentifier = /[a-zA-Z:\-]/
const kIdentifierEdge = /[a-zA-Z]/

// -- impls --
export const ParserResult = {
  // a success result with a value
  value<V>(value: V, slice: Slice): ParserResult<V> {
    return { stat: PS.success, slice, value }
  },
  // a success result with no value
  empty(slice: Slice): ParserResult<null> {
    return { stat: PS.success, slice, value: null }
  },
  // a failure result
  error<V>(slice: Slice): ParserResult<V> {
    return { stat: PS.failure, slice }
  }
}

// -- i/parsers
// a parser for a literal string
export function literal(expected: string): Parser<null> {
  return (str) => {
    const len = expected.length

    if (str.startsWith(expected)) {
      return ParserResult.empty(str.slice(len))
    } else {
      return ParserResult.error(str)
    }
  }
}

// a parser for an identifier
export function identifier(str: Slice): ParserResult<string> {
  // if empty, error
  if (str.length === 0) {
    return ParserResult.error(str)
  }

  // if start is not an edge char, error
  if (!str[0].match(kIdentifierEdge)) {
    return ParserResult.error(str)
  }

  // continue until a non-identifier character
  let i = 1
  for (/* none */; i < str.length; i++) {
    if (!str[i].match(kIdentifier)) {
      break
    }
  }

  // if end is not an edge char, error
  if (!str[i - 1].match(kIdentifierEdge)) {
    return ParserResult.error(str)
  }

  // return identifier
  const res = ParserResult.value(
    str.slice(0, i),
    str.slice(i),
  )

  return res
}

// -- i/combinators
// a parser with a mapped value
export function map<I, O>(
  p1: Parser<I>,
  fn: (i: I) => O
): Parser<O> {
  return (input) => {
    const r1 = p1(input)

    switch (r1.stat) {
    case PS.success:
      return ParserResult.value(fn(r1.value), r1.slice)
    case PS.failure:
      return r1
    }
  }
}

// a parser that repeats the input zero or more times
export function repeat<V>(p1: Parser<V>, min = 0): Parser<V[]> {
  return (input) => {
    const values = []

    // starting from the input
    let rest = input
    while (true) {
      // parse the rest
      const r1 = p1(rest)

      // if failure, finish
      if (r1.stat === PS.failure) {
        break
      }
      // otherwise, add value and repeat on rest
      else {
        rest = r1.slice
        values.push(r1.value)
      }
    }

    // if not enough values, error
    if (values.length < min) {
      return ParserResult.error(input)
    }

    // otherwise, return value
    return ParserResult.value(values, rest)
  }
}

// -- i/c/pairs
// a parser of two sequential parsers
export function pair<L, R>(
  p1: Parser<L>,
  p2: Parser<R>
): Parser<[L, R]> {
  return (str) => {
    // try the first parser
    const r1 = p1(str)
    if (r1.stat === PS.failure) {
      return ParserResult.error(str)
    }

    // try the second parser on the remainder
    const r2 = p2(r1.slice)
    if (r2.stat === PS.failure) {
      return ParserResult.error(str)
    }

    // combine the values
    const res = ParserResult.value(
      tuple(r1.value, r2.value),
      r2.slice
    )

    return res
  }
}

// a parser that selects the left value from a pair
export function left<L, R>(
  p1: Parser<[L, R]>
): Parser<L> {
  return map(p1, ([l, _]) => l)
}

// a parser that selects the right value from a pair
export function right<L, R>(
  p1: Parser<[L, R]>
): Parser<R> {
  return map(p1, ([_, r]) => r)
}

// -- i/data
// a tuple
function tuple<L, R>(l: L, r: R): [L, R] {
  return [l, r]
}