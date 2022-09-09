import { assertEquals, clean } from "../../Test/mod.ts"
import { TemplateFrag } from "./TemplateFrag.ts"

// -- setup --
const { test } = Deno

// -- tests --
test("it compiles w:frag elements", () => {
  const plugin = new TemplateFrag.Plugin()

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