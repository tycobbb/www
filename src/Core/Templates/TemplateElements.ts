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
  pattern,
  pred,
  repeat,
  right,
  sequence,
  surround,
  trio,
} from "../Parser/mod.ts"

// input:
// <w-frag
//   path="./post"
//   i=5
// />
//
// output:
// <%~
//   include("./post.f.html", {
//     i: 5,
//   })
// %>

// -- constants --
const k = {
  identifier: /^[a-zA-Z]([\w:-]*\w)?/,
  whitespace: /^\s*/,
}

// -- types --
// the possible parsed node types
export enum TemplateNodeKind {
  text,
  slice,
  element,
}

import NK = TemplateNodeKind

// a parsed node
export type TemplateNode
  = { kind: NK.text, text: string }
  | { kind: NK.slice, input: string, len: number }
  | { kind: NK.element, element: TemplateElement }

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
  children: string | null,
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
// a parser for a sequence of elements
export function decode(): Parser<TemplateNode[]> {
  return repeat(
    either(
      map(
        element(),
        (e) => TemplateNode.element(e)
      ),
      mapInput(
        any,
        (_, input) => TemplateNode.slice(input, 1)
      ),
    ),
    () => [],
    (nodes: TemplateNode[], node) => {
      // if this node was merged w/ the last
      let isMerge = false

      // get previous node
      const i = nodes.length - 1
      const p = nodes[i]

      /// if the prev was a slice
      if (p != null && p.kind === NK.slice) {
        // if this is also a slice, merge
        if (node.kind === NK.slice) {
          isMerge = true
          p.len += node.len
        }
        // otherwise, convert prev to text
        else {
          nodes[i] = TemplateNode.text(p.input.slice(0, p.len))
        }
      }

      // if no merge, append a new node
      if (!isMerge) {
        nodes.push(node)
      }

      return nodes
    },
  )
}

// a parser for a element
function element(): Parser<TemplateElement> {
  return map(
    trio(
      // open tag
      right(
        literal("<"),
        pred(
          identifier(),
          (id) => id === "w:frag"
        ),
      ),
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
          surround(
            children(),
            whitespace(),
          ),
          literal("/>"),
        ),
      ),
    ),
    (vs) => ({
      name: vs[0],
      attrs: vs[1],
      children: vs[2],
    })
  )
}

// a parser for a sequence of attrs
function attrs(): Parser<TemplateElementAttrs> {
  return map(
    delimited(
      attr(),
      whitespace(),
    ),
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
    map(
      sequence(pred(any, (c) => c !== "\"")),
      (cs) => cs.join("")
    ),
    literal("\"")
  )
}

// a parser for an element's children
function children(): Parser<string> {
  return any
}

// -- i/p/shared
// a parser for an identifier
function identifier(): Parser<string> {
  return pattern(k.identifier)
}

// a parser for repeated whitespace
function whitespace(): Parser<string> {
  return pattern(k.whitespace)
}