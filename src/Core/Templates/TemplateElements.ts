import { EtaConfig } from "https://deno.land/x/eta@v1.12.3/config.ts"
import { Parser } from "../Parser/mod.ts"
import { map, repeat, any, pred, literal, pattern, trio, right, outer, surround, delimited } from "../Parser/mod.ts"

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
// an element
type Element = {
  name: string,
  attrs: ElementAttrs
}

// an element's attributes
type ElementAttrs = {
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
export function element(): Parser<Element> {
  return map(
    trio(
      right(
        literal("<"),
        identifier(),
      ),
      surround(
        attrs(),
        whitespace(),
      ),
      literal("/>")
    ),
    (vs) => ({
      name: vs[0],
      attrs: vs[1]
    })
  )
}

function attrs(): Parser<ElementAttrs> {
  return map(
    delimited(
      attr(),
      whitespace(),
    ),
    (as) => (as.reduce((memo: ElementAttrs, [k, v]) => {
      memo[k] = v
      return memo
    }, {}))
  )
}

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

function attrName(): Parser<string> {
  return identifier()
}

function attrValue(): Parser<string> {
  return surround(
    map(
      repeat(pred(any, (c) => c !== "\"")),
      (cs) => cs.join("")
    ),
    literal("\"")
  )
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