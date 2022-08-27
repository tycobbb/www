import { assertEquals, clean } from "../../Test/mod.ts"
import { Html, HtmlNode } from "./Html.ts"

// -- setup --
const { test } = Deno

// -- tests --
test("it matches elements", () => {
  const html = new Html([
    "w:frag"
  ])

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

  const output: HtmlNode[] = [
    HtmlNode.element({
      name: "w:frag",
      attrs: {
        path: "./test",
        test: "one",
      },
      children: null,
    }),
    HtmlNode.text(clean(/^ {2}(?=\s*\S)/gm, `

      <a href="https://test.url">
        test link
      />

    `)),
    HtmlNode.element({
      name: "w:frag",
      attrs: {
        path: "./test",
        test: "two",
      },
      children: [
        HtmlNode.text(clean(/(^ {4}(?=\s*\S))|( {2}$)/gm, `
          plain text

        `)),
        HtmlNode.element({
          name: "w:frag",
          attrs: {
            path: "./test",
            test: "three",
          },
          children: null,
        }),
        HtmlNode.text(clean(/ {4}$/gm, `
        `)),
      ],
    }),
  ]

  const actual = html.decode(input.trim())
  assertEquals(actual, output)
})