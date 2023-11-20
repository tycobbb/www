import { assertEquals, assertLength, scrub, stubEvents, undent } from "../../Test/mod.ts"
import { Templates } from "./Templates.ts"
import { TemplateEvent } from "./TemplateEvent.ts"

// -- setup --
const { test } = Deno

// we need singletons for these bc of eta's static configuration
const evts = stubEvents<TemplateEvent>()
const tmpl = new Templates(() => [], evts)

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
        frag("./post", {
          i
        })
      %>
    <% } %>
  `)

  const res = await tmpl.render("posts/test")
  assertEquals(scrub(res), "012")
})

test("it includes a fragment by absolute path", async () => {
  reset()
  tmpl.add("base", `hello`)
  tmpl.add("posts/test", `
    <%~ frag("base") %>
  `)

  const res = await tmpl.render("posts/test")
  assertEquals(scrub(res), "hello")
})

test("it includes a fragment element w/ args", async () => {
  reset()
  tmpl.add("posts/post.f.html", undent(`
    <%= it.link %>
    <%= it.body %>
  `))
  tmpl.add("posts/test", undent(`
    <w:frag
      path="./post"
      link=\`<a href="http://test.com">test</a>\`
      body=\`test has (parens).\`
    />
  `))

  const res = await tmpl.render("posts/test")
  assertEquals(res, "&lt;a href=&quot;http://test.com&quot;&gt;test&lt;/a&gt;test has (parens).")
})

test("it includes a layout", async () => {
  reset()
  tmpl.add("page/layout", `
    0<%= it.body %>2
  `)

  tmpl.add("page/test", `
    <% layout("./layout") %>
    1
  `)

  const res = await tmpl.render("page/test")
  assertEquals(scrub(res), "012")
})

test("it includes data", async () => {
  reset()
  tmpl.addData("page/strings", {
    test: "test data"
  })
  tmpl.add("page/test", `
    <%= data("./strings").test %>
  `)

  const res = await tmpl.render("page/test")
  assertEquals(scrub(res), "testdata")
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
      <%~ frag("./post" + i) %>
    <% } %>
  `)

  await tmpl.render("posts/test")
  assertLength(evts.all, 3)
  assertEquals(evts.all[0], TemplateEvent.include("strings", "posts/test" ))
  assertEquals(evts.all[1], TemplateEvent.include("posts/post0", "posts/test" ))
  assertEquals(evts.all[2], TemplateEvent.include("posts/post1", "posts/test" ))
})

test("it emits query events", async () => {
  reset()
  tmpl.add("posts", `
    <%~
      query("./posts/*", {
        body: "test"
      })
    %>
  `)

  await tmpl.render("posts")
  assertLength(evts.all, 1)
  assertEquals(evts.all[0], TemplateEvent.query("posts/*", "posts" ))
})