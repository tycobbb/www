import { assertEquals } from "../Test/mod.ts"
import { Path } from "./Path.ts"

// -- setup --
const { test } = Deno

// -- tests --
test("it parses extensions", () => {
  const path = Path.raw("some/file.t.html")
  assertEquals(path.frag, "some/file")
  assertEquals(path.ext, ["t", "html"])
})

test("it sets extensions", () => {
  const src = Path.raw("some/file.t.html", "base")
  const dst = src.setExt("html")
  assertEquals(dst.str, "base/some/file.html")
})

test("it parses paths to files", () => {
  const path = Path.raw("foo.p.test", "some/dir")
  assertEquals(path.str, "some/dir/foo.p.test")
  assertEquals(path.ext, ["p", "test"])
})

test("it parses paths to hidden files", () => {
  const path = Path.raw(".test", "some/dir")
  assertEquals(path.str, "some/dir/.test")
  assertEquals(path.ext, null)
})
