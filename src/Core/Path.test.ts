import { Path } from "./Path.ts"
import { assertEquals } from "https://deno.land/std/testing/asserts.ts"

// -- setup --
const { test } = Deno

// -- tests --
test("Path ~ it parses the extension", () => {
  const path = new Path("some/file.t.html")
  assertEquals(path.extension(), ".t.html")
})
