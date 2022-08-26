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
    >
      plain text

      <w:frag
        path="./test"
        test="three"
      />
    </w:frag>
  `

  const output: TemplateNode[] = [
    TemplateNode.element({
      name: "w:frag",
      attrs: {
        path: "./test",
        test: "one",
      },
      children: null,
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
      children: [
        TemplateNode.text(clean(/(^ {4}(?=\s*\S))|( {2}$)/gm, `
          plain text

        `)),
        TemplateNode.element({
          name: "w:frag",
          attrs: {
            path: "./test",
            test: "three",
          },
          children: null,
        }),
        TemplateNode.text(clean(/ {4}$/gm, `
        `)),
      ],
    }),
  ]

  const match = decode()
  assertParser(match(input.trim()), ParserResult.value(output, ""))
})