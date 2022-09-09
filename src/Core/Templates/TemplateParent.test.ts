import { assertEquals, clean } from "../../Test/mod.ts"
import { TemplateParent } from "./TemplateParent.ts"

// -- setup --
const { test } = Deno

// -- tests --
test("it compiles helpers", () => {
  const plugin = new TemplateParent()
  const input =
    `include(__l,Object.assign(it,{body:tR},__lP))`
  const output =
    `include(__l,"parent",Object.assign(it,{body:tR},__lP))`

  // deno-lint-ignore no-explicit-any
  const actual = plugin.processFnString(input, { path: "parent" } as any)
  assertEquals(actual, output)
})