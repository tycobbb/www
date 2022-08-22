import { assertEquals, assertLength, clean, stubEvents } from "../../Test/mod.ts"
import { Templates } from "./Templates.ts"
import { TemplateEvent } from "./TemplateEvent.ts"

// -- setup --
const { test } = Deno

// we need singletons for these bc of eta's static configuration
const evts = stubEvents<TemplateEvent>()
const tmpl = new Templates(evts)

// a helper to reset the singletons
function reset() {
  evts.reset()
  tmpl.reset()
}

// -- tests --
test("it renders templates", async () => {
  reset()
  tmpl.add("post", `<%= it.body %>`)

  const res = await tmpl.render("post", { body: "hi" })
  assertEquals(res, "hi")
})

test("it includes a fragment", async () => {
  reset()
  tmpl.add("posts/post", `<%= it.i %>`)
  tmpl.add("posts/test", `
    <% for (let i = 0; i < 3; i++) { %>
      <%~
        include("./post", {
          i
        })
      %>
    <% } %>
  `)

  const res = await tmpl.render("posts/test")
  assertEquals(clean(res), "012")
})

test("it includes an absolutely-pathed fragment", async () => {
  reset()
  tmpl.add("base", `hello`)
  tmpl.add("posts/test", `
    <%~ include("base") %>
  `)

  const res = await tmpl.render("posts/test")
  assertEquals(clean(res), "hello")
})

test("it applies layouts", async () => {
  reset()
  tmpl.add("page/layout", `
    0<%= it.body %>2
  `)

  tmpl.add("page/test", `
    <% layout("./layout") %>
    1
  `)

  const res = await tmpl.render("page/test")
  assertEquals(clean(res), "012")
})

test("it uses data", async () => {
  reset()
  tmpl.addData("page/strings", {
    test: "test data"
  })
  tmpl.add("page/test", `
    <%= data("./strings").test %>
  `)

  const res = await tmpl.render("page/test")
  assertEquals(clean(res), "testdata")
})

test("it emits include events", async () => {
  reset()
  tmpl.add("posts/post0", `1`)
  tmpl.add("posts/post1", `2`)
  tmpl.addData("strings", {
    test: "test data"
  })
  tmpl.add("posts/test", `
    <%= data("strings").test %>
    <% for (let i = 0; i < 2; i++) { %>
      <%~ include("./post" + i) %>
    <% } %>
  `)

  await tmpl.render("posts/test")
  assertLength(evts.all, 3)
  assertEquals(evts.all[0], TemplateEvent.include("strings", "posts/test" ))
  assertEquals(evts.all[1], TemplateEvent.include("posts/post0", "posts/test" ))
  assertEquals(evts.all[2], TemplateEvent.include("posts/post1", "posts/test" ))
})