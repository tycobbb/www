import { EtaConfig } from "https://deno.land/x/eta@v1.12.3/config.ts"
import { Parser } from "../Parser/mod.ts"
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
// the possible parsed node types
export enum TemplateNodeKind {
  element,
  text,
  slice,
}

import NK = TemplateNodeKind

// a parsed node
export type TemplateNode
  = { kind: NK.element, element: TemplateElement }
  | { kind: NK.text, text: string }
  | { kind: NK.slice, input: string, len: number }

export const TemplateNode = {
  // create a text node
  text(text: string): TemplateNode {
    return { kind: NK.text, text }
  },
  // create a slice node
  slice(input: string, len: number): TemplateNode {
    return { kind: NK.slice, input, len }
  },
  // create an element node
  element(element: TemplateElement): TemplateNode {
    return { kind: NK.element, element }
  }
}

// an element
export type TemplateElement = {
  name: string,
  attrs: TemplateElementAttrs,
  children: TemplateNode[] | null,
}

// an element's attributes
export type TemplateElementAttrs = {
  [key: string]: string
}

// -- impls --
// an eta plugin that compiles build-time html elements into eta calls
export class TemplateElements {
  // -- EtaPlugin --
  processTemplate(str: string, _: EtaConfig): string {
    return str
  }
}

// -- i/parsers
// a parser for a sequence of nodes
export function decode(): Parser<TemplateNode[]> {
  return nodes()
}

// a parser for a sequence of nodes
export function nodes(close: Parser<unknown> | null = null): Parser<TemplateNode[]> {
  return map(
    repeat(
      either(
        map(
          element(),
          (e) => TemplateNode.element(e)
        ),
        mapInput(
          unless(
            any,
            close,
          ),
          (_, input) => TemplateNode.slice(input, 1)
        ),
      ),
      // init list
      () => [],
      // build list, merging consecutive slices
      (nodes: TemplateNode[], n) => {
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
          return TemplateNode.text(n.input.slice(0, n.len))
        }

        return n
      })
    },
  )
}

// a parser for an element
function element(): Parser<TemplateElement> {
  return then(
    // open tag
    right(
      pair(
        literal("<"),
        whitespace(),
      ),
      pred(
        identifier(),
        (id) => id === "w:frag"
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
            children(name),
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
function attrs(): Parser<TemplateElementAttrs> {
  return map(
    delimited(
      attr(),
      whitespace(),
    ),
    // convert list of kv-tuples into a map
    (as) => (as.reduce((memo: TemplateElementAttrs, [k, v]) => {
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
function children(name: string) {
  return nodes(close(name))
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