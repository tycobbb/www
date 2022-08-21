import { assertEquals } from "../Test/mod.ts"
import { Path } from "./Path.ts"

// -- setup --
const { test } = Deno

// -- tests --
test("it parses extensions", () => {
  const path = new Path("some/file.t.html")
  assertEquals(path.frag, "some/file")
  assertEquals(path.ext, ".t.html")
})

test("it sets extensions", () => {
  const src = new Path("some/file.t.html", "base")
  const dst = src.setExt("html")
  assertEquals(dst.str, "base/some/file.html")
})
