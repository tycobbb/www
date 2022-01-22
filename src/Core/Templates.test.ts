import { assertEquals } from "../Test/mod.ts"
import { Templates } from "./Templates.ts"
import { clean } from "../Test/mod.ts"

// -- setup --
const { test } = Deno

// -- tests --
test("Templates ~ it renders templates", () => {
  const tmpls = Templates.get()
  tmpls.reset()
  tmpls.add("post", `<%= it.body %>`)

  const res = tmpls.render("post", { body: "hi" })
  assertEquals(res, "hi")
})

test("Templates ~ it resolves layout paths", () => {
  const tmpls = Templates.get()
  tmpls.reset()
  tmpls.add("core/layout", `
    0<%= it.body %>2
  `)

  tmpls.add("test/page", `
    <% layout("../core/layout") %>
    1
  `)

  const res = tmpls.render("test/page")
  assertEquals(clean(res), "012")
})

test("Templates ~ it resolves include paths", () => {
  const tmpls = Templates.get()
  tmpls.reset()
  tmpls.add("core/post", `<%= it.i %>`)
  tmpls.add("test/posts", `
    <% for (let i = 0; i < 3; i++) { %>
      <%~ include("../core/post", { i }) %>
    <% } %>
  `)

  const res = tmpls.render("test/posts")
  assertEquals(clean(res), "012")
})
