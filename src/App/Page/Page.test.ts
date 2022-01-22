import { stubConfig, assertIncludes, assertNotIncludes } from "../../Test/mod.ts"
import { Page } from "./Page.ts"

// -- todos --
// TODO: would be nice to be able to match a chunk that wasn't too
// picky about whitespace
// TODO: these are clearly imperfect tests, as they don't check the position
// of elements in the document

// -- setup --
const { test } = Deno

// stub config
const cfg = stubConfig()

// build paths
const src = cfg.paths.src

// -- tests --
test("Page ~ it cleans up nested templates", () => {
  const path = src.join("./test.p.html")
  const page = new Page(path, `
    <html>
    <body>
      <w:template>
        <p class="test">hello, test.</p>
      </w:template>
    </body>
    </html>
  `)

  const file = page.render()
  assertIncludes(file.text, "hello, test")
  assertNotIncludes(file.text, "<w:template>")
})

test("Page ~ it merges head elements", () => {
  const path = src.join("./test.p.html")
  const page = new Page(path, `
    <html>
    <head>
      <title>root</title>
    </head>

    <body>
      <w:head>
        <title>leaf</title>
      </w:head>

      <body>
        <p class="test">hello, test.</p>
      </body>
    </body>
    </html>
  `)

  const file = page.render()

  assertIncludes(file.text, "<title>leaf</title>")
  assertNotIncludes(file.text, "<w:head>")
})

test("Page ~ it merges elements with the head attribute", () => {
  const path = src.join("./test.p.html")
  const page = new Page(path, `
    <html>
    <head>
      <title>root</title>
    </head>

    <body>
      <title w:head>leaf</title>

      <body>
        <p class="test">hello, test.</p>
      </body>
    </body>
    </html>
  `)

  const file = page.render()
  assertIncludes(file.text, "<title>leaf</title>")
  assertNotIncludes(file.text, "w:head")
})
