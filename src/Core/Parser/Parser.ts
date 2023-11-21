// -- flags --
const INST_SUCCESS = 1 << 0
const INST_FAILURE = 1 << 1
const INST: number | false = false

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

// a success result
export type ParserSuccess<V>
  = { stat: PS.success, slice: Slice, value: V }

// a failure result
export type ParserFailure
  = { stat: PS.failure, slice: Slice, error: string }

// the result of any parser
export type ParserResult<V>
  = ParserSuccess<V>
  | ParserFailure

// a parser that may parse a slice
export type Parser<V>
  = (input: Slice) => ParserResult<V>

// a parser that may parse a slice & has state
export type ParserWith<V, S>
  = (input: Slice, state: S) => ParserResult<V>

// -- impls --
// init a parser
export function parser<V>(name: string, parser: Parser<V>) {
  if (!INST) {
    return parser
  }

  const nameCol = name.padEnd(10)

  const instrumented: Parser<V> = (input) => {
    const res = parser(input)
    const restCol = res.slice.slice(0, 10).padEnd(10)

    if (res.stat === PS.success)  {
      if (INST & INST_SUCCESS) {
        console.log(`[parser] ✔ ${nameCol} | ${restCol} -> ${res.value}`)
      }
    }
    else {
      if (INST & INST_FAILURE) {
        console.log(`[parser] ✘ ${nameCol} | ${restCol} -> ${res.error}`)
      }
    }

    return res
  }

  Object.defineProperty(instrumented, "name", { value: name })

  return instrumented
}

export const ParserResult = {
  // a success result with a value
  value<V>(value: V, slice: Slice): ParserResult<V> {
    return { stat: PS.success, slice, value }
  },
  // a success result with no value
  empty(slice: Slice): ParserResult<null> {
    return { stat: PS.success, slice, value: null }
  },
  // a failure result an error
  error<V>(slice: Slice, error: string): ParserResult<V> {
    return { stat: PS.failure, slice, error }
  },
  // a failure result with no error
  fault<V>(slice: Slice): ParserResult<V> {
    return { stat: PS.failure, slice, error: "" }
  },
}

// -- debug --
// a parser that that we can hook a breakpoint into
export function debug<A>(
  p1: Parser<A>
): Parser<A> {
  return (input) => {
    return p1(input)
  }
}

// dump the escaped string
export function dump(string: string): string {
  if (!INST) {
    return string
  }

  const res = JSON.stringify(string)
  return res.slice(1, res.length - 1)
}