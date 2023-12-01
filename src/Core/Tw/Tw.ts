import { Parser, ParserStatus as PS, Aggregate } from "../Parser/mod.ts"
import { segments, unemoji } from "../String.ts"
import {
  any,
  first,
  just,
  map,
  pattern,
  repeatUntil,
  right,
  sequence,
  surround,
  trio,
  whitespace,
} from "../Parser/mod.ts"

// -- constants --
const k = {
  date: /^(.*)\n?/,
  like: /^(.*)\n?/,
  divider: /^\n?---\s*\n/,
}

// -- types --
// a parsed tw node
export interface TwPost {
  body: string,
  date: Date,
  like: string[]
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
    surround(
      post(),
      whitespace()
    ),
  )
}

// a parser for a single post
function post(): Parser<TwPost> {
  return map(
    trio(
      body(),
      date(),
      likes()
    ),
    ([body, date, like]) => ({
      body,
      date,
      like
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

// a parser for the post likes
function likes(): Parser<string[]> {
  return first(
    map(
      pattern(k.like, 1),
      (match) => segments(match).map(unemoji)
    ),
    just(() => [])
  )
}

// a parser for a post body divider
function divider(): Parser<unknown> {
  return pattern(k.divider)
}
