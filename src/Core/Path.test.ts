import { assertEquals } from "../Test/mod.ts"
import { Path } from "./Path.ts"

// -- setup --
const { test } = Deno

// -- tests --
test("Path ~ it parses components", () => {
  const path = new Path("some/file.t.html")
  assertEquals(path.components(), ["some/file", ".t.html"])
})
