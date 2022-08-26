import { assertParser, clean } from "../../Test/mod.ts"
import { ParserResult } from "../Parser/Parser.ts"
import { decode, TemplateNode } from "./TemplateElements.ts"

// -- setup --
const { test } = Deno

// -- tests --
test("it matches elements", () => {
  const input = `
    <w:frag
      path="./test"
      test="one"
    />

    <a href="https://test.url">
      test link
    />

    <w:frag
      path="./test"
      test="two"
    />
  `

  const output: TemplateNode[] = [
    TemplateNode.element({
      name: "w:frag",
      attrs: {
        path: "./test",
        test: "one",
      },
      children: null
    }),
    TemplateNode.text(clean(/^ {2}(?=\s*\S)/gm, `

      <a href="https://test.url">
        test link
      />

    `)),
    TemplateNode.element({
      name: "w:frag",
      attrs: {
        path: "./test",
        test: "two",
      },
      children: null
    })
  ]

  const match = decode()
  assertParser(match(input.trim()), ParserResult.value(output, ""))
})