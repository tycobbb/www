import { assertEquals, assertLength, clean, stubEvents } from "../Test/mod.ts"
import { Templates, IncludeEvent } from "./Templates.ts"

// -- setup --
const { test } = Deno

// stub events
const evts = stubEvents<IncludeEvent>()

// -- tests --
test("it renders templates", async () => {
  const tmpl = new Templates(evts)
  tmpl.reset()
  tmpl.add("post", `<%= it.body %>`)

  const res = await tmpl.render("post", { body: "hi" })
  assertEquals(res, "hi")
})

test("it resolves layout paths", async () => {
  const tmpl = new Templates(evts)
  tmpl.reset()
  tmpl.add("core/layout", `
    0<%= it.body %>2
  `)

  tmpl.add("test/page", `
    <% layout("../core/layout") %>
    1
  `)

  const res = await tmpl.render("test/page")
  assertEquals(clean(res), "012")
})

test("it resolves include paths", async () => {
  const tmpl = new Templates(evts)
  tmpl.reset()
  tmpl.add("core/post", `<%= it.i %>`)
  tmpl.add("test/posts", `
    <% for (let i = 0; i < 3; i++) { %>
      <%~
        include("../core/post", {
          i
        })
      %>
    <% } %>
  `)

  const res = await tmpl.render("test/posts")
  assertEquals(clean(res), "012")
})

test("it resolves absolute include paths", async () => {
  const tmpl = new Templates(evts)
  tmpl.reset()
  tmpl.add("base", `hello`)
  tmpl.add("test/child", `
    <%~ include("/base") %>
  `)

  const res = await tmpl.render("test/child")
  assertEquals(clean(res), "hello")
})

test("it emits include events", async () => {
  const tmpl = new Templates(evts)
  evts.reset()
  tmpl.reset()
  tmpl.add("core/post0", `1`)
  tmpl.add("core/post1", `2`)
  tmpl.add("test/posts", `
    <% for (let i = 0; i < 2; i++) { %>
      <%~ include("../core/post" + i) %>
    <% } %>
  `)

  await tmpl.render("test/posts")
  assertLength(evts.all, 2)
  assertEquals(evts.all[0], { child: "core/post0", parent: "test/posts" })
  assertEquals(evts.all[1], { child: "core/post1", parent: "test/posts" })
})
