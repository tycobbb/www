import { HtmlContext } from "./HtmlContext.ts"
import { Parser, ParserStatus as PS, } from "../Parser/mod.ts"
import {
  any,
  delimited,
  first,
  inner,
  literal,
  map,
  outer,
  pair,
  pattern,
  pred,
  right,
  sparse,
  str,
  surround,
  then,
  unless,
  whitespace,
  validate,
} from "../Parser/mod.ts"

// -- constants --
const k = {
  // identifiers
  id: {
    name: /^[a-zA-Z]([\w:-]*\w)?/,
  },
  void: Object.freeze(new Set([
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
  ]))
}

// -- types --
// the possible parsed node types
export enum HtmlNodeKind {
  element,
  text,
}

import NK = HtmlNodeKind

// a parsed html node
export type HtmlNode
  = HtmlElementNode
  | HtmlTextNode

export type HtmlElementNode =
  { kind: NK.element, element: HtmlElement }

export type HtmlTextNode =
  { kind: NK.text, text: string }

export const HtmlNode = {
  // create a text node
  text(text: string): HtmlNode {
    return { kind: NK.text, text }
  },
  // create an element node
  element(element: HtmlElement): HtmlNode {
    return { kind: NK.element, element }
  }
}

// an element
export type HtmlElement = {
  name: string,
  attrs: HtmlElementAttrs,
  children: HtmlNode[] | null,
}

// an element's attributes
export type HtmlElementAttrs = {
  [key: string]: string
}

// -- impls --
// an html parser for a set of elements
export class Html {
  // -- props --
  // a parser for a sequence of html nodes
  readonly #decode: Parser<HtmlNode[]>

  // -- lifetime --
  // create a new html parser
  constructor() {
    // init context
    const ctx = new HtmlContext()

    // bind decode fn
    this.#decode = nodes(ctx, null)
  }

  // -- queries --
  // decode input into nodes, returning null if error
  decode(input: string): HtmlNode[] | null {
    const res = this.#decode(input)
    if (res.stat === PS.success) {
      return res.value
    } else {
      return null
    }
  }
}

// -- i/parsers
// a parser for a sequence of nodes
function nodes(
  ctx: HtmlContext,
  close: Parser<unknown> | null,
): Parser<HtmlNode[]> {
  return sparse(
    map(
      element(ctx),
      HtmlNode.element,
    ),
    unless(
      any,
      close,
    ),
    HtmlNode.text,
  )
}

// a parser for an element
function element(
  ctx: HtmlContext
): Parser<HtmlElement> {
  return then(
    // open tag
    open(),
    // the rest, closed by the same name
    (name) => {
      // push the name onto the stack
      ctx.push(name)

      // and try and parse the body
      return body(ctx)
    },
  )
}

// a parser for an element's opening tag
function open(): Parser<string> {
  return right(
    pair(
      literal("<"),
      whitespace(),
    ),
    identifier(),
  )
}

// a parser for an element's body
function body(
  ctx: HtmlContext,
): Parser<HtmlElement> {
  return map(
    pair(
      // attributes
      surround(
        attrs(),
        whitespace(),
      ),
      // close tag...
      first(
        // void
        pred(
          literal(">"),
          () => k.void.has(ctx.peek()),
        ),
        // self-closing
        map(
          literal("/>"),
          () => []
        ),
        // or with children
        inner(
          literal(">"),
          children(ctx),
          validate(
            close(),
            (res) => {
              const name = ctx.peek()
              if (res.value !== name) {
                throw new Error(`[html] tag <${name}> cannot be closed by </${res.value}>`)
              }

              return res
            }
          )
        ),
      ),
    ),
    // convert into element
    ([attrs, children]) => ({
      name: ctx.pop(),
      attrs,
      children
    })
  )
}

// a parser for a sequence of attrs
function attrs(): Parser<HtmlElementAttrs> {
  return map(
    delimited(
      attr(),
      whitespace(),
    ),
    // convert list of kv-tuples into a map
    (as) => (as.reduce((memo: HtmlElementAttrs, [k, v]) => {
      memo[k] = v
      return memo
    }, {}))
  )
}

// a parser for an attr
function attr(): Parser<[string, string]> {
  return outer(
    attrName(),
    surround(
      literal("="),
      whitespace(),
    ),
    attrValue()
  )
}

// a parser for the name of an attr
function attrName(): Parser<string> {
  return identifier()
}

// a parser for the value of an attr
function attrValue(): Parser<string> {
  return str()
}

// a parser for a close tag
function close(): Parser<string> {
  return inner(
    literal("</"),
    surround(
      identifier(),
      whitespace()
    ),
    literal(">"),
  )
}

// a parser for children closed by a named tag
function children(ctx: HtmlContext) {
  return nodes(ctx, close())
}

// -- i/p/shared
// a parser for an identifier
function identifier(): Parser<string> {
  return pattern(k.id.name)
}