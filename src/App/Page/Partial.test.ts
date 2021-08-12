import { assertIncludes, assertNotIncludes } from "../../Core/Test.ts"
import { Partial } from "./Partial.ts"

// -- setup --
const { test } = Deno

// -- tests --
test("Partial ~ it compiles vars", () => {
  const partial = Partial.parse(`
    <body>
      <div><v$ id="v-test" /></div>
    </body
  `)

  const vars = {
    "v-test": "hello, test"
  }

  const compiled = partial.compile(vars)
  assertIncludes(compiled, "<div>hello, test</div>")
  assertNotIncludes(compiled, `<v$ id="body" />`)
})

test("Partial ~ it renders html", () => {
  const partial = Partial.parse(`
    <body>
      <v$ id="body" />
    </body
  `)

  const vars = {
    "body": "<p>hello, test</p>"
  }

  const compiled = partial.compile(vars)
  assertIncludes(compiled, "<p>hello, test</p>")
})
