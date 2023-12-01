import { assertEquals, undent } from "../../Test/mod.ts"
import { Tw, TwPost } from "./Tw.ts"
import { unemoji } from "../String.ts"

// -- setup --
const { test } = Deno

// -- tests --
test("it matches posts", () => {
  const tw = new Tw()
  const input = undent(`
    ---
    a first post
    w line breaks in it

    & some <span>tags</span>
    ---
    2023-11-11T10:00:00-05:00
    ❤️

    ---
    a second post
    ---
    2023-11-12T13:00:00-04:00
  `)

  const output: TwPost[] = [
    {
      body: undent(`
        a first post
        w line breaks in it

        & some <span>tags</span>
      `),
      date: new Date(1699714800000),
      like: [unemoji("❤")]
    }, {
      body: undent(`
        a second post
      `),
      date: new Date(1699808400000),
      like: []
    },
  ]

  const actual = tw.decode(input)
  assertEquals(actual, output)
})