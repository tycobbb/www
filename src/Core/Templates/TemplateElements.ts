import { EtaConfig } from "https://deno.land/x/eta@v1.12.3/config.ts"
import { Slice, Parser, ParserResult } from "../Parser/mod.ts"
import { any, literal, whitespace, pair, repeat } from "../Parser/mod.ts"

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
  identifier: {
    any: /[a-zA-Z:\-]/,
    edge: /[a-zA-Z]/,
  },
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
// a parser for an identifier
function identifier(input: Slice): ParserResult<string> {
  // if empty, error
  if (input.length === 0) {
    return ParserResult.error(input)
  }

  // if start is not an edge char, error
  if (!input[0].match(k.identifier.edge)) {
    return ParserResult.error(input)
  }

  // continue until a non-identifier character
  let i = 1
  for (/* none */; i < input.length; i++) {
    if (!input[i].match(k.identifier.any)) {
      break
    }
  }

  // if end is not an edge char, error
  if (!input[i - 1].match(k.identifier.edge)) {
    return ParserResult.error(input)
  }

  // return identifier
  const res = ParserResult.value(
    input.slice(0, i),
    input.slice(i),
  )

  return res
}

function attr(): Parser<string> {
  pair(
    identifier,
    pair(
      repeat(whitespace()),
      pair(
        literal("="),
        repeat(whitespace())
      )
    )
  )
  return (input) => {
    return ParserResult.error(input)
  }
}

function attrValue(): Parser<string> {
  pair(
    literal("\""),
    pair(
      repeat(any),
      literal("\""),
    )
  )

  return (input) => {
    return ParserResult.error(input)
  }
}