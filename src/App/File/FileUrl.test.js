import { assertEquals } from "../../Test/mod.ts"
import { FileUrl } from "./FileUrl.ts"

// -- setup --
const { test } = Deno

// -- tests --
test("FileUrl ~ it finds paths for the root", () => {
  const url = new FileUrl("/?p1=a")

  const paths = url.findPaths("./test")
  assertEquals(paths, [
    "test/index.html",
  ])
})

test("FileUrl ~ it finds paths for a page", () => {
  const url = new FileUrl("/page?p1=a")

  const paths = url.findPaths("./test")
  assertEquals(paths, [
    "test/page.html",
    "test/page/index.html",
  ])
})

test("FileUrl ~ it finds paths for assets", () => {
  const url = new FileUrl("/page.css?p1=a")

  const paths = url.findPaths("./test")
  assertEquals(paths, [
    "test/page.css",
  ])
})
