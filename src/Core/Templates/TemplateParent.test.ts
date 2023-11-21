import { assertEquals, undent } from "../../Test/mod.ts"
import { TemplateParent } from "./TemplateParent.ts"

// -- setup --
const { test } = Deno

// -- tests --
test("it compiles helpers", () => {
  const plugin = new TemplateParent()
  const input = `
    include(5 + "test" + 3,Object.assign(it,{body:tR},__lP),{a:"1",b:"2"})
  `
  const output = `
    include(5 + "test" + 3,"parent",Object.assign(it,{body:tR},__lP),{a:"1",b:"2"})
  `

  // deno-lint-ignore no-explicit-any
  const actual = plugin.processFnString(input.trim(), { path: "parent" } as any)
  assertEquals(actual, output.trim())
})

test("it compiles nested helpers", () => {
  const plugin = new TemplateParent()
  const input = `
    include("test1",include("test2"))
  `
  const output = `
    include("test1","parent",include("test2","parent"))
  `

  // deno-lint-ignore no-explicit-any
  const actual = plugin.processFnString(input.trim(), { path: "parent" } as any)
  assertEquals(actual, output.trim())
})

test("it doesn't modify quoted strings", () => {
  const plugin = new TemplateParent()
  const input = `
    'this is (plaintext)'
  `
  const output = `
    'this is (plaintext)'
  `

  // deno-lint-ignore no-explicit-any
  const actual = plugin.processFnString(undent(input), { path: "parent" } as any)
  assertEquals(actual, undent(output))
})