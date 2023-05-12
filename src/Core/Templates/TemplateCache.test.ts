import { assertEquals, assertRejects, assertThrows } from "../../Test/mod.ts"
import { TemplateCache } from "./TemplateCache.ts"

// -- setup --
const { test } = Deno

// -- tests --
test("it renders a template", async () => {
  const cache = new TemplateCache()
  cache.add("post", `<%= it.body %>`)

  const res = await cache.render("post", { body: "hi" })
  assertEquals(res, "hi")
})

test("it renders a child template", () => {
  const cache = new TemplateCache()
  cache.addChild("posts", "posts/*", `<%= it.body %>`)

  const res = cache.renderChild("posts", "posts/*", { body: "hi" })
  assertEquals(res, "hi")
})

test("it deletes a template", async () => {
  const cache = new TemplateCache()
  cache.add("post", `<%= it.body %>`)

  cache.delete("post")
  await assertRejects(() => cache.render("post"), Error)
})

test("it deletes a child template", () => {
  const cache = new TemplateCache()
  cache.addChild("posts", "posts/*", `<%= it.body %>`)

  cache.delete("posts")
  assertThrows(() => cache.renderChild("posts", "posts/*"), Error)
})