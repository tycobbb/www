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

export type ParserWith<V, S>
  = (input: Slice, state: S) => ParserResult<V>

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
  // a failure result an error
  error<V>(slice: Slice, error: string): ParserResult<V> {
    return { stat: PS.failure, slice, error }
  },
  // a failure result with no error
  fault<V>(slice: Slice): ParserResult<V> {
    return { stat: PS.failure, slice, error: "" }
  },
}

// -- i/parsers
// a parser for a literal string
export function literal(expected: string): Parser<null> {
  return (input) => {
    const len = expected.length

    if (input.startsWith(expected)) {
      return ParserResult.empty(input.slice(len))
    } else {
      return ParserResult.error(input, `[parser] literal - ${input.slice(0, 10)}... != ${expected}`)
    }
  }
}

// a parser for any character
export function any(input: Slice): ParserResult<string> {
  if (input.length === 0) {
    return ParserResult.error(input, `any - input was empty`)
  } else {
    return ParserResult.value(input[0], input.slice(1))
  }
}

// -- i/combinators
// a parser with a value transformed by a functiom
export function map<A, B>(
  p1: Parser<A>,
  transform: (value: A) => B
): Parser<B> {
  return mapInput(p1, (val, _) => transform(val))
}

// a parser with a value & input transformed by a functiom
export function mapInput<A, B>(
  p1: Parser<A>,
  transform: (value: A, input: Slice) => B
): Parser<B> {
  return (input) => {
    const r1 = p1(input)
    switch (r1.stat) {
      case PS.success:
        return ParserResult.value(transform(r1.value, input), r1.slice)
      case PS.failure:
        return r1
    }
  }
}

// a parser followed by another parser using value of the first (e.g. flat map)
export function then<A, B>(
  p1: Parser<A>,
  transform: (i: A) => Parser<B>
): Parser<B> {
  return (input) => {
    const r1 = p1(input)
    switch (r1.stat) {
      case PS.success:
        return transform(r1.value)(r1.slice)
      case PS.failure:
        return r1
    }
  }
}

// a parser that whose value passes the test
export function pred<A>(
  p1: Parser<A>,
  predicate: (v: A) => boolean
): Parser<A> {
  return (input) => {
    const r1 = p1(input)

    // if the value fails the test, error
    if (r1.stat === PS.success && !predicate(r1.value)) {
      return ParserResult.error(input, `[parser] pred - ${r1.value} did not pass`)
    }

    // otherwise, return the result
    return r1
  }
}

// a parser that requires another parser fail
export function unless<A>(
  p1: Parser<A>,
  p2: Parser<unknown> | null,
): Parser<A> {
  // if unconditional, always try the parser
  if (p2 === null) {
    return p1
  }

  // otherwise, we may short-circuit on the condition
  return (input) => {
    // if condition succeeds, error
    const r2 = p2(input)
    if (r2.stat === PS.success) {
      return ParserResult.error(input, `[parser] unless - short-circuiting parser succeeded`)
    }

    // otherwise, try the parser
    return p1(input)
  }
}

// a parser the validates the value of another parser
export function validate<A>(
  p1: Parser<A>,
  validate: (input: Slice, res: ParserSuccess<A>) => ParserResult<A>,
): Parser<A> {
  return (input) => {
    const r1 = p1(input)
    if (r1.stat === PS.success) {
      return validate(input, r1)
    }

    return r1
  }
}

// a parser that matches a pattern
export function pattern(
  pattern: RegExp
): Parser<string> {
  return (input) => {
    // try the pattern
    const match = input.match(pattern)

    // if no match, fail
    if (match == null) {
      return ParserResult.error(input, `[parser] pattern - ${input.slice(0, 10)}... did not match`)
    }

    // if this matched after the first index, an exception
    if (match.index !== 0) {
      throw new Error(`[parser] pattern ${pattern} may only match at beginning of string, '^'`)
    }

    // otherwise, match the slice
    const val = match[0]
    const res = ParserResult.value(
      val,
      input.slice(val.length)
    )

    return res
  }
}

// a parser that repeats the zero or more times
export function sequence<V>(
  p1: Parser<V>,
  min = 0
): Parser<V[]> {
  return validate(
    repeat(p1, () => new Array<V>(), (vs, v) => {
      vs.push(v)
      return vs
    }),
    (input, res) => {
      const n = res.value.length
      if (n < min) {
        return ParserResult.error(input, `[parser] repeat - ${input.slice(0, 10)}... matced ${n} < ${min}`)
      }

      return res
    }
  )
}

// a parser that repeats the zero or more times
export function repeat<V, M>(
  p1: Parser<V>,
  initial: () => M,
  reduce: (memo: M, val: V) => M,
): Parser<M> {
  return (input) => {
    let memo = initial()

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
        memo = reduce(memo, r1.value)
      }
    }

    // otherwise, return value
    return ParserResult.value(memo, rest)
  }
}

// -- i/c/groups
// a parser of two sequential parsers
export function pair<A, B>(
  p1: Parser<A>,
  p2: Parser<B>
): Parser<[A, B]> {
  return (input) => {
    // try the first parser
    const r1 = p1(input)
    if (r1.stat === PS.failure) {
      return ParserResult.error(input, `[parser] pair - p1 did not pass`)
    }

    // try the second parser on the remainder
    const r2 = p2(r1.slice)
    if (r2.stat === PS.failure) {
      return ParserResult.error(input, `[parser] pair - p2 did not pass`)
    }

    // combine the values
    const res = ParserResult.value(
      tuple(r1.value, r2.value),
      r2.slice
    )

    return res
  }
}

// a parser of three sequential parsers
export function trio<A, B, C>(
  p1: Parser<A>,
  p2: Parser<B>,
  p3: Parser<C>
): Parser<[A, B, C]> {
  return map(
    pair(pair(p1, p2), p3),
    ([[a, b], c]) => [a, b, c]
  )
}

// a parser that selects the left value from a pair
export function left<A, B>(
  p1: Parser<A>,
  p2: Parser<B>
): Parser<A> {
  return map(pair(p1, p2), ([l, _]) => l)
}

// a parser that selects the right value from a pair
export function right<A, B>(
  p1: Parser<A>,
  p2: Parser<B>
): Parser<B> {
  return map(pair(p1, p2), ([_, r]) => r)
}

// a parser of a trio that returns the outer values
export function outer<A, B, C>(
  p1: Parser<A>,
  p2: Parser<B>,
  p3: Parser<C>
): Parser<[A, C]> {
  return map(
    pair(pair(p1, p2), p3),
    ([[a, _], c]) => [a, c]
  )
}

// a parser of a trio that returns the inner value
export function inner<A, B, C>(
  p1: Parser<A>,
  p2: Parser<B>,
  p3: Parser<C>
): Parser<B> {
  return map(
    pair(pair(p1, p2), p3),
    ([[_a, b], _]) => b
  )
}

// a parser that surrounds the second parser with the first
export function surround<A, B>(
  p1: Parser<A>,
  p2: Parser<B>
): Parser<A> {
  return inner(p2, p1, p2)
}

// a parser that is delimited by another parser
export function delimited<A, B>(
  p1: Parser<A>,
  p2: Parser<B>
): Parser<A[]> {
  return (input) => {
    const values = []

    // starting from the input
    let rest = input

    // also keep track of the slice from the last parsed entry (p1)
    let restEntry = rest

    while (true) {
      const r1 = p1(rest)

      // if failure, finish and restore rest from the prev entry
      if (r1.stat === PS.failure) {
        rest = restEntry
        break
      }

      // otherwise, aggregate value
      values.push(r1.value)
      restEntry = r1.slice

      // and try and parse a delimiter
      const r2 = p2(r1.slice)
      if (r2.stat === PS.failure) {
        break
      }

      rest = r2.slice
    }

    // otherwise, return value
    return ParserResult.value(values, restEntry)
  }
}

// a parser that matches the first of two parsers
export function first<A, B>(
  p1: Parser<A>,
  p2: Parser<B>,
): Parser<A | B>;

// a parser that matches the first of three parsers
export function first<A, B, C>(
  p1: Parser<A>,
  p2: Parser<B>,
  p3: Parser<C>,
): Parser<A | B | C>;

// a parser that matches the first of four parsers
export function first<A, B, C, D>(
  p1: Parser<A>,
  p2: Parser<B>,
  p3: Parser<C>,
  p4: Parser<D>,
): Parser<A | B | C | D>;

export function first<A, B, C, D>(
  ...ps: Parser<A | B | C | D>[]
): Parser<A | B | C | D> {
  return (input) => {
    // try the first parser
    for (const pi of ps) {
      const ri = pi(input)
      if (ri.stat === PS.success) {
        return ri
      }
    }

    // if neither pass, this fails
    return ParserResult.error(input, `[parser] first - all failed`)
  }
}

// a parser created once at runtime; you might need this to avoid infinite
// recursion.
export function lazy<A>(
  create: () => Parser<A>,
): Parser<A> {
  // the instance
  let p1: Parser<A> | null

  // the caching parser
  return (input) => {
    p1 ||= create()
    return p1(input)
  }
}

// a parser created once-by-key at runtime; you might need this to avoid
// infinite recursion.
export function cache<A>(
  mem: { [key: string]: Parser<A> },
  key: string,
  create: () => Parser<A>
): Parser<A> {
  return (input) => {
    // find or create the parser
    let p1 = mem[key]
    if (p1 == null) {
      p1 = mem[key] = create()
    }

    // and try it
    return p1(input)
  }
}

// -- i/data
// create a tuple
export function tuple<A, B>(
  i1: A,
  i2: B
): [A, B] {
  return [i1, i2]
}

// -- i/utils
// unwrap a parser into a fn producing an optional
export function unwrap<A>(
  p1: Parser<A>
): (input: string) => A | null {
  return (input) => {
    const r1 = p1(input)
    if (r1.stat === PS.success) {
      return r1.value
    } else {
      return null
    }
  }
}