import { makeElement } from "../../Test/Factories/HtmlFactories.ts";
import { assertEquals, clean, undent } from "../../Test/mod.ts"
import { Html, HtmlNode } from "./Html.ts"

// -- setup --
const { test } = Deno

// -- tests --
test("it parses an element tree", () => {
  const html = new Html()

  const input = `
    <w:frag
      path="./test"
      test="one"
    />

    <a href="https://test.url">
      test link
    </a>

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
      children: [],
    }),
    HtmlNode.text(`

    `),
    HtmlNode.element({
      name: "a",
      attrs: {
        href: "https://test.url",
      },
      children: [
        HtmlNode.text(`
      test link
    `),
      ],
    }),
    HtmlNode.text(`

    `),
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
          children: [],
        }),
        HtmlNode.text(clean(/ {4}$/gm, `
        `)),
      ],
    }),
  ]

  const actual = html.decode(input.trim())
  assertEquals(actual, output)
})

test("it parses void elements", () => {
  const html = new Html()

  const input = undent(`
    <br>
    <embed>
    <hr>
    <img>
    <input>
    <link>
    <meta>
    <source>
  `)

  const output: HtmlNode[] = [
    HtmlNode.element(makeElement({ name: "br" })),
    HtmlNode.text("\n"),
    HtmlNode.element(makeElement({ name: "embed" })),
    HtmlNode.text("\n"),
    HtmlNode.element(makeElement({ name: "hr" })),
    HtmlNode.text("\n"),
    HtmlNode.element(makeElement({ name: "img" })),
    HtmlNode.text("\n"),
    HtmlNode.element(makeElement({ name: "input" })),
    HtmlNode.text("\n"),
    HtmlNode.element(makeElement({ name: "link" })),
    HtmlNode.text("\n"),
    HtmlNode.element(makeElement({ name: "meta" })),
    HtmlNode.text("\n"),
    HtmlNode.element(makeElement({ name: "source" })),
  ]

  const actual = html.decode(input.trim())
  assertEquals(actual, output)
})