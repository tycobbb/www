import { assertEquals, clean } from "../../Test/mod.ts"
import { TemplateFrag } from "./TemplateFrag.ts"
import { TemplateHtml } from "./TemplateHtml.ts"

// -- setup --
const { test } = Deno

// -- tests --
test("it compiles w:frag elements", () => {
  const plugin = new TemplateHtml([
    new TemplateFrag.Compiler()
  ])

  const input = `
    <w:frag
      path="./test"
      test="one"
    />
  `

  const output = `
      <%~
        frag("./test.f.html", {
          test: "one"
        })
      %>
  `

  // deno-lint-ignore no-explicit-any
  const actual = plugin.processTemplate(input, null as any)
  assertEquals(clean(/^ {2}(?=\s*\S)/gm, actual.trim()), output.trim())
})

test("it compiles w:frag elements w/ slots", () => {
  const plugin = new TemplateHtml([
    new TemplateFrag.Compiler()
  ])

  const input = `
    <w:frag
      path="./test"
      test="one"
    >
      <p>test</p>

      <w:slot name="slot">
        <p>test slot</p>
      </w:slot>
    </w:frag>
  `

  const output = `
      <%~
        frag("./test.f.html", {
          test: "one",
slot: "\\n        <p>test slot</p>\\n      ",
body: "\\n      <p>test</p>\\n\\n      \\n    "
        })
      %>
  `

  // deno-lint-ignore no-explicit-any
  const actual = plugin.processTemplate(input, null as any)
  assertEquals(clean(/^ {2}(?=\s*\S)/gm, actual.trim()), output.trim())
})