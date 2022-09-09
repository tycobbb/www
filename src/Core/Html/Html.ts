import { Parser, ParserStatus as PS, } from "../Parser/mod.ts"
import {
  any,
  cache,
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
  trio,
  unless,
  whitespace,
} from "../Parser/mod.ts"

// -- constants --
const k = {
  // identifiers
  identifier: {
    name: /^[a-zA-Z]([\w:-]*\w)?/,
  },
  // body element
  body: {
    // cache for lazily-evaluated parsers keyed by path
    cache: <{[key: string]: Parser<HtmlElement>}>{}
  }
}

// -- types --
// a parsing configuration
export type HtmlConfig = Readonly<{
  elements: ReadonlySet<string>
}>

// the possible parsed node types
export enum HtmlNodeKind {
  element,
  text,
}

import NK = HtmlNodeKind

// a parsed html node
export type HtmlNode
  = { kind: NK.element, element: HtmlElement }
  | { kind: NK.text, text: string }

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
  // the list of legal elements
  readonly #decode: Parser<HtmlNode[]>

  // -- liftime --
  // create a new html parser
  constructor(elements: string[]) {
    // init config
    const cfg = Object.freeze({
      elements: Object.freeze(new Set(elements))
    })

    this.#decode = nodes(cfg, null)
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
  cfg: HtmlConfig,
  close: Parser<unknown> | null,
): Parser<HtmlNode[]> {
  return sparse(
    map(
      element(cfg),
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
  cfg: HtmlConfig
): Parser<HtmlElement> {
  return then(
    // open tag
    open(cfg),
    // the rest, closed by the same name
    (name) => body(cfg, name),
  )
}

// a parser for an element's opening tag
function open(
  cfg: HtmlConfig,
): Parser<string> {
  return right(
    pair(
      literal("<"),
      whitespace(),
    ),
    pred(
      identifier(),
      (name) => cfg.elements.has(name)
    ),
  )
}

// a parser for an element's body
function body(
  cfg: HtmlConfig,
  name: string,
): Parser<HtmlElement> {
  return cache(
    k.body.cache,
    `html/body/${name}`,
    () => $body(cfg, name),
  )
}

function $body(
  cfg: HtmlConfig,
  name: string,
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
        // self-closing
        literal("/>"),
        // or with children
        inner(
          literal(">"),
          children(cfg, name),
          close(name),
        ),
      ),
    ),
    // convert into element
    ([attrs, children]) => ({
      name,
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

// a parser for a named close tag
function close(name: string): Parser<unknown> {
  return trio(
    literal("</"),
    surround(
      literal(name),
      whitespace()
    ),
    literal(">"),
  )
}

// a parser for children closed by a named tag
function children(cfg: HtmlConfig, name: string) {
  return nodes(cfg, close(name))
}

// -- i/p/shared
// a parser for an identifier
function identifier(): Parser<string> {
  return pattern(k.identifier.name)
}