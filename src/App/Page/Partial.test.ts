import { assertIncludes, assertNotIncludes, assertMatch } from "../../Test/mod.ts"
import { Partial } from "./Partial.ts"

// -- setup --
const { test } = Deno

// -- tests --
test("Partial ~ it binds vars", () => {
  const partial = Partial.parse(`
    <body>
      <div><v$ id="v-test" /></div>
    </body
  `)

  const vars = {
    "v-test": "hello, test"
  }

  const compiled = partial.bind(vars).compile()
  assertIncludes(compiled, "<div>hello, test</div>")
  assertNotIncludes(compiled, `<v$ id="body" />`)
})

test("Partial ~ it renders nested partials", () => {
  const partial = Partial.parse(`
    <body>
      <v$ id="body" />
    </body
  `)

  const vars = {
    body: Partial.parse("<p>hello, test</p>").bind()
  }

  const compiled = partial.bind(vars).compile()
  assertMatch(compiled, /<body>\s*<p>hello, test<\/p>\s*<\/body>/)
})
