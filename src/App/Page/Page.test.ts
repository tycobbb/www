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
test("it cleans up nested templates", () => {
  const page = new Page(`
    <html>
    <body>
      <w:template>
        <p class="test">hello, test.</p>
      </w:template>
    </body>
    </html>
  `)

  const html = page.render()
  assertIncludes(html, "hello, test")
  assertNotIncludes(html, "<w:template>")
})

test("it merges head elements", () => {
  const page = new Page(`
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

  const html = page.render()
  assertIncludes(html, "<title>leaf</title>")
  assertNotIncludes(html, "<w:head>")
})

test("it merges elements with the head attribute", () => {
  const page = new Page(`
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
    </html>
  `)

  const html = page.render()
  assertIncludes(html, "<title>leaf</title>")
  assertNotIncludes(html, "<title>root</title>")
  assertNotIncludes(html, "w:head")
})
