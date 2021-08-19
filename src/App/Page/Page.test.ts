import { stubConfig, assertEquals, assertIncludes } from "../../Test/mod.ts"
import { Page } from "./Page.ts"
import { Layout } from "./Layout.ts"
import { Partial } from "./Partial.ts"

// -- setup --
const { test } = Deno

// stub config
const cfg = stubConfig()

// build paths
const src = cfg.paths.src

// -- tests --
test("Page ~ it compiles", () => {
  const layout = new Layout(
    src.join("./test.l.html"),
    Partial.parse(`
      <html>
      <head>
        <title>test</title>
      </head>

      <body>
        <div><v$ id="body" /></div>
      </body>
      </html>
    `),
  )

  const page = new Page(
    src.join("./test.p.html"),
    Partial.parse(`
      <style>
        .test { color: papayawhip; }
      </style>

      <body>
        <p class="test">hello, test.</p>
      </body>

      <script>
        console.log("hello, test")
      </script>
    `),
    layout,
  )

  const file = page.compile()
  assertEquals(file.path.relative, "test.html")

  // TODO: would be nice to be able to match a chunk that wasn't too
  // picky about whitespace
  assertIncludes(file.text, "<title>test</title>")
  assertIncludes(file.text, ".test { color: papayawhip; }")
  assertIncludes(file.text, "<p class=\"test\">hello, test.</p>")
})

test("Page ~ it compiles with a shared layout", () => {
  const layout = new Layout(
    src.join("./test.l.html"),
    Partial.parse(`<v$ id="body" />`),
  )

  const page1 = new Page(
    src.join("./test1.p.html"),
    Partial.parse(`<p>hello, test 1.</p>`),
    layout,
  )

  const page2 = new Page(
    src.join("./test2.p.html"),
    Partial.parse(`<p>hello, test 2.</p>`),
    layout,
  )

  page1.compile()

  const file = page2.compile()
  assertIncludes(file.text, "<p>hello, test 2.</p>")
})
