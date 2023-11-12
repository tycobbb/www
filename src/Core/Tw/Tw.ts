import { Parser, ParserStatus as PS, Aggregate } from "../Parser/mod.ts"
import {
  any,
  left,
  map,
  pair,
  pattern,
  right,
  repeatUntil,
  sequence,
  whitespace,
  debug
} from "../Parser/mod.ts"

// -- constants --
const k = {
  date: /^(.*)\s*(\n|$)/,
  divider: /^\n?---\s*\n/,
}

// -- types --
// a parsed tw node
export interface TwPost {
  body: string,
  date: Date,
}

// -- impls --
// an thoughtworld file format parser
export class Tw {
  // -- props --
  // a parser for a sequence of thoughtworld posts
  readonly #decode: Parser<TwPost[]>

  // -- lifetime --
  // create a new thoughtworld parser
  constructor() {
    this.#decode = posts()
  }

  // -- queries --
  // decode input into posts, returning null if error
  decode(input: string): TwPost[] | null {
    const res = this.#decode(input)
    if (res.stat === PS.success) {
      return res.value
    } else {
      return null
    }
  }
}

// -- i/parsers
// a parser for a sequence of posts
function posts(): Parser<TwPost[]> {
  return sequence(
    left(
      post(),
      whitespace()
    ),
  )
}

// a parser for a single post
function post(): Parser<TwPost> {
  return map(
    pair(
      body(),
      date()
    ),
    ([body, date]) => ({
      body,
      date
    })
  )
}

// a parser for the post body
function body(): Parser<string> {
  return right(
    divider(),
    repeatUntil(
      any,
      divider(),
      ...Aggregate.string
    )
  )
}

// a parser for the post date
function date(): Parser<Date> {
  return map(
    pattern(k.date, 1),
    (match) => new Date(match)
  )
}

// a parser for a post body divider
function divider(): Parser<unknown> {
  return pattern(k.divider)
}