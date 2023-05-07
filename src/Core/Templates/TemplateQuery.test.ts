import { assertEquals, clean } from "../../Test/mod.ts"
import { TemplateHtml } from "./TemplateHtml.ts"
import { TemplateQuery } from "./TemplateQuery.ts"

// -- setup --
const { test } = Deno

// -- tests --
test("it compiles w:query elements", () => {
  const plugin = new TemplateHtml([
    new TemplateQuery.Compiler()
  ])

  const input = `
    <w:query path="./posts/*">
      <%= it.name %>
    </w:query>
  `

  const output = `
    <%~
      query("./posts/*", {
        body: "\\n      <%= it.name %>\\n    "
      })
    %>
  `

  // deno-lint-ignore no-explicit-any
  const actual = plugin.processTemplate(input, null as any)
  assertEquals(clean(/^ {4}(?=\s*\S)/gm, actual.trim()), output.trim())
})