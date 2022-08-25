import { assertParser } from "../../Test/mod.ts"
import { ParserResult } from "../Parser/Parser.ts"
import { element } from "./TemplateElements.ts"

// -- setup --
const { test } = Deno

// -- tests --
test("it matches an element", () => {
  const input = `
    <w:frag
      path="./test"
      test="value"
    />
  `

  const output = {
    name: "w:frag",
    attrs: {
      path: "./test",
      test: "value",
    },
  }

  const match = element()
  assertParser(match(input.trim()), ParserResult.value(output, ""))
})