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
  assertIncludes(file.text, "<title>test</title>")
  assertIncludes(file.text, "<p class=\"test\">hello, test.</p>")
})
