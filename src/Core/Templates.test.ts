import { assertEquals } from "../Test/mod.ts"
import { Templates } from "./Templates.ts"

// -- setup --
const { test } = Deno

// -- tests --
test("Templates ~ it parses templates", () => {
  const tmpls = new Templates()
  tmpls.init()
  const res = tmpls.render("post.p.html", `<%= it.body %>`, { body: "hi" })
  assertEquals(res, "hi")
})

test("Templates ~ it resolves include paths", () => {
  const tmpls = new Templates()
  tmpls.init()
  tmpls.add("core/post.f.html", `<%= it.i %>`)

  const res = tmpls.render("test/posts.p.html", `
    <% for (let i = 0; i < 3; i++) { %>
      <%~ include("../core/post", { i }) %>
    <% } %>`
  )

  assertEquals(res.replaceAll(/\s*/g, ""), "012")
})
