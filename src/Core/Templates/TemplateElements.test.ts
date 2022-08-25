import { assertParser } from "../../Test/mod.ts"
import { ParserResult } from "../Parser/Parser.ts"
import { elements, TemplateNode, TemplateNodeKind as NK } from "./TemplateElements.ts"

// -- setup --
const { test } = Deno

// -- tests --
test("it matches elements", () => {
  const input = `
    <w:frag
      path="./test"
      test="value"
    />
  `

  const output: TemplateNode[] = [{
    kind: NK.element,
    element: {
      name: "w:frag",
      attrs: {
        path: "./test",
        test: "value",
      },
      children: null
    }
  }]

  const match = elements()
  assertParser(match(input.trim()), ParserResult.value(output, ""))
})