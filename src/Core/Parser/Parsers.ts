import { Parser, ParserResult, ParserSuccess, ParserStatus as PS, Slice, parser, dump } from "./Parser.ts"

// -- types --
// an aggregate from element to accumulated value
export type Aggregate<T, U> = [
  () => U,
  (memo: U, next: T) => U
]

// -- impls --
function agg<T, U>(
  initial: () => U,
  reduce: (memo: U, next: T) => U
): Aggregate<T, U> {
  return [initial, reduce]
}

export const Aggregate = {
  string: agg<string, string>(
    () => "",
    (memo, next) => memo + next
  ),
  array: <T,> () => agg<T, T[]>(
    () => [],
    (memo, next) => {
      memo.push(next)
      return memo
    }
  )
}

// -- i/parsers
// a parser that always errors
export function never<A>(input: string): ParserResult<A> {
  return ParserResult.error(input, `never: fails`)
}

// a parser that always succeeds
export function just<A>(value: () => A): Parser<A> {
  return parser(just.name, (input) => {
    return ParserResult.value(value(), input)
  })
}

// a parser for a literal string
export function literal(expected: string): Parser<null> {
  return parser(literal.name, (input) => {
    const len = expected.length

    if (input.startsWith(expected)) {
      return ParserResult.empty(input.slice(len))
    } else {
      return ParserResult.error(input, `literal: ${input.slice(0, 10)}... != ${expected}`)
    }
  })
}

// a parser for any character
export function any(input: Slice): ParserResult<string> {
  if (input.length === 0) {
    return ParserResult.error(input, `any: input was empty`)
  } else {
    return ParserResult.value(input[0], input.slice(1))
  }
}

// a parser that matches a pattern
export function pattern(
  regex: RegExp,
  group: number = 0
): Parser<string> {
  return parser(pattern.name, (input) => {
    // try the pattern
    const match = input.match(regex)

    // if no match, fail
    if (match == null) {
      return ParserResult.error(input, `pattern: "${dump(input.slice(0, 10) + "...")}" did not match ${regex}`)
    }

    // if this matched after the first index, an exception
    if (match.index !== 0) {
      throw new Error(`[parser] pattern: ${regex} may only match at beginning of string, '^'`)
    }

    // otherwise, match the slice
    const val = match[group]
    const res = ParserResult.value(
      val,
      input.slice(match[0].length)
    )

    return res
  })
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
  return parser(mapInput.name, (input) => {
    const r1 = p1(input)
    switch (r1.stat) {
      case PS.success:
        return ParserResult.value(transform(r1.value, input), r1.slice)
      case PS.failure:
        return r1
    }
  })
}

// a parser followed by another parser using value of the first (e.g. flat map)
export function then<A, B>(
  p1: Parser<A>,
  transform: (i: A) => Parser<B>
): Parser<B> {
  return parser(then.name, (input) => {
    const r1 = p1(input)
    switch (r1.stat) {
      case PS.success:
        return transform(r1.value)(r1.slice)
      case PS.failure:
        return r1
    }
  })
}

// a parser that whose value passes the test
export function pred<A>(
  p1: Parser<A>,
  predicate: (v: A) => boolean
): Parser<A> {
  return parser(pred.name, (input) => {
    const r1 = p1(input)

    // if the value fails the test, error
    if (r1.stat === PS.success && !predicate(r1.value)) {
      return ParserResult.error(input, `pred: ${p1.name} - ${r1.value} did not pass`)
    }

    // otherwise, return the result
    return r1
  })
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
  return parser(unless.name, (input) => {
    // if condition succeeds, error
    const r2 = p2(input)
    if (r2.stat === PS.success) {
      return ParserResult.error(input, `unless: p2 ${p2.name} short-circuited p1 ${p1.name}`)
    }

    // otherwise, try the parser
    return p1(input)
  })
}

// a parser the validates the value of another parser
export function validate<A>(
  p1: Parser<A>,
  validate: (res: ParserSuccess<A>, input: Slice) => ParserResult<A>,
): Parser<A> {
  return parser(validate.name, (input) => {
    const r1 = p1(input)
    if (r1.stat === PS.success) {
      return validate(r1, input)
    }

    return r1
  })
}

// a parser that repeats the zero or more times
export function sequence<A>(
  p1: Parser<A>,
  min = 0
): Parser<A[]> {
  return validate(
    repeat(
      p1,
      ...Aggregate.array<A>()
    ),
    (res, input) => {
      const n = res.value.length
      if (n < min) {
        return ParserResult.error(input, `repeat: ${input.slice(0, 10)}... matched ${n} < ${min}`)
      }

      return res
    }
  )
}

// a parser that repeats the zero or more times
export function repeat<A, M>(
  p1: Parser<A>,
  initial: () => M,
  reduce: (memo: M, val: A) => M,
): Parser<M> {
  return parser(repeat.name, (input) => {
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
  })
}

// a parser that repeats until the delimiter
export function repeatUntil<A, B, M>(
  p1: Parser<A>,
  p2: Parser<B>,
  initial: () => M,
  reduce: (memo: M, val: A) => M,
): Parser<M> {
  return parser(repeatUntil.name, (input) => {
    // accumulate repeated value
    let memo = initial()

    // starting from input
    let rest = input
    while (true) {
      // check for the delimiter to terminate
      const r2 = p2(rest)
      if (r2.stat === PS.success) {
        rest = r2.slice
        break
      }

      // if not delimited, try repeated parser
      const r1 = p1(rest)
      if (r1.stat === PS.failure) {
        return ParserResult.error(input, r1.error)
      }

      // and accumulate
      memo = reduce(memo, r1.value)
      rest = r1.slice
    }

    return ParserResult.value(memo, rest)
  })
}

// -- i/c/groups
// a parser of two sequential parsers
export function pair<A, B>(
  p1: Parser<A>,
  p2: Parser<B>
): Parser<[A, B]> {
  return parser(pair.name, (input) => {
    // try the first parser
    const r1 = p1(input)
    if (r1.stat === PS.failure) {
      return ParserResult.error(input, `pair: p1 ${p1.name} - did not pass`)
    }

    // try the second parser on the remainder
    const r2 = p2(r1.slice)
    if (r2.stat === PS.failure) {
      return ParserResult.error(input, `pair: p2 ${p2.name} - did not pass`)
    }

    // combine the values
    const res = ParserResult.value(
      tuple(r1.value, r2.value),
      r2.slice
    )

    return res
  })
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
  return parser(delimited.name, (input) => {
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
  })
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
  return parser(first.name, (input) => {
    // try the parsers in order
    for (const pi of ps) {
      const ri = pi(input)
      if (ri.stat === PS.success) {
        return ri
      }
    }

    // if none pass, this fails
    return ParserResult.error(input, `first: all failed`)
  })
}

// a parser created once at runtime; you might need this to avoid infinite
// recursion.
export function lazy<A>(
  create: () => Parser<A>,
): Parser<A> {
  // the instance
  let p1: Parser<A> | null

  // the caching parser
  return parser(lazy.name, (input) => {
    p1 ||= create()
    return p1(input)
  })
}

// a parser created once-by-key at runtime; you might need this to avoid
// infinite recursion.
export function cache<A>(
  mem: { [key: string]: Parser<A> },
  key: string,
  create: () => Parser<A>
): Parser<A> {
  return parser(cache.name, (input) => {
    // find or create the parser
    let p1 = mem[key]
    if (p1 == null) {
      p1 = mem[key] = create()
    }

    // and try it
    return p1(input)
  })
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