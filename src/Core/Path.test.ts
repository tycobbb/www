import { assertEquals } from "https://deno.land/std/testing/asserts.ts"
import { Path } from "./Path.ts"

// -- setup --
const { test } = Deno

// -- tests --
test("Path ~ it parses the components", () => {
  const path = new Path("some/file.t.html")
  assertEquals(path.components(), ["some/file", ".t.html"])
})
