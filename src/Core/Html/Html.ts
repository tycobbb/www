import { Parser, ParserStatus as PS } from "../Parser/mod.ts"
import {
  any,
  delimited,
  either,
  inner,
  literal,
  map,
  mapInput,
  outer,
  pair,
  pattern,
  pred,
  repeat,
  right,
  surround,
  then,
  trio,
  unless,
} from "../Parser/mod.ts"

// -- constants --
const k = {
  // identifier patterns
  identifier: {
    name: /^[a-zA-Z]([\w:-]*\w)?/,
  },
  // attribute patterns
  attr: {
    value: /[^\"]*/,
  },
  // utility patterns
  core: {
    whitespace: /^\s*/,
  },
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
  slice,
}

import NK = HtmlNodeKind

// a parsed node
export type HtmlNode
  = { kind: NK.element, element: HtmlElement }
  | { kind: NK.text, text: string }
  | { kind: NK.slice, input: string, len: number }

export const HtmlNode = {
  // create a text node
  text(text: string): HtmlNode {
    return { kind: NK.text, text }
  },
  // create a slice node
  slice(input: string, len: number): HtmlNode {
    return { kind: NK.slice, input, len }
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
  return map(
    repeat(
      either(
        map(
          element(cfg),
          (e) => HtmlNode.element(e)
        ),
        mapInput(
          unless(
            any,
            close,
          ),
          (_, input) => HtmlNode.slice(input, 1)
        ),
      ),
      // init list
      () => [],
      // build list, merging consecutive slices
      (nodes: HtmlNode[], n) => {
        const p = nodes[nodes.length - 1]

        // if the prev and next are slices, merge
        if (p != null && p.kind === NK.slice && n.kind === NK.slice) {
          p.len += n.len
        }
        // otherwise, append the new node
        else {
          nodes.push(n)
        }

        return nodes
      },
    ),
    // finalize slices as text
    (nodes) => {
      return nodes.map((n) => {
        if (n.kind === NK.slice) {
          return HtmlNode.text(n.input.slice(0, n.len))
        }

        return n
      })
    },
  )
}

// a parser for an element
function element(
  cfg: HtmlConfig
): Parser<HtmlElement> {
  return then(
    // open tag
    right(
      pair(
        literal("<"),
        whitespace(),
      ),
      pred(
        identifier(),
        (name) => cfg.elements.has(name)
      ),
    ),
    // the rest, closed by the same name
    (name) => map(
      pair(
        // attributes
        surround(
          attrs(),
          whitespace(),
        ),
        // close tag...
        either(
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
  return surround(
    pattern(k.attr.value),
    literal("\""),
  )
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

// a parser for repeated whitespace
function whitespace(): Parser<string> {
  return pattern(k.core.whitespace)
}