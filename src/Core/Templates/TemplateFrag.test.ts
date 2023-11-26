import { assertEquals, squeeze } from "../../Test/mod.ts"
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
  assertEquals(squeeze(actual), squeeze(output))
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

      <w:slot name="asel">
        <p>test element slot</p>
      </w:slot>

      <p w:slot="attr">
        test attr slot
      </p>
    </w:frag>
  `

  const output = `
    <%~
      frag("./test.f.html", {
        test: "one",
        asel: " <p >test element slot</p> ",
        attr: "<p > test attr slot </p>",
        body: " <p >test</p> "
      })
    %>
  `

  // deno-lint-ignore no-explicit-any
  const actual = plugin.processTemplate(input, null as any)
  assertEquals(squeeze(actual), squeeze(output))
})