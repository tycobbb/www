import { stubLog, stubConfig, stubEvents, assert, assertEquals, assertLength, assertIncludes, assertInstanceOf } from "../../Test/mod.ts"
import { FileRef } from "../File/mod.ts"
import { Pages } from "./Pages.ts"

// -- setup --
const { test } = Deno

// stub globals
stubLog()
const cfg = stubConfig()
const evts = stubEvents()

// build paths
const src = cfg.paths.src

// -- tests --
test("it links a page and layout", async () => {
  const pages = new Pages(evts)
  evts.reset()
  await pages.change(FileRef.init(src.join("./bz.l.html")))
  await pages.change(FileRef.init(src.join("./link.f.html")))
  await pages.change(FileRef.init(src.join("./links.d.json")))
  await pages.change(FileRef.init(src.join("./b1.p.html")))

  await pages.render()
  assertLength(evts.all, 1)

  const evt = evts.all[0]
  assert(evt.name === "save-file")
  assertEquals(evt.file.path.rel, "b1.html")
})

test("it deletes nodes w/ a compiled representation", async () => {
  const pages = new Pages(evts)
  evts.reset()
  await pages.change(FileRef.init(src.join("./bz.l.html")))
  await pages.change(FileRef.init(src.join("./b1.p.html")))
  await pages.change(FileRef.init(src.join("./links.d.json")))

  pages.delete(FileRef.init(src.join("./b1.p.html")))
  pages.delete(FileRef.init(src.join("./links.d.json")))

  assertLength(evts.all, 1)

  const evt = evts.all[0]
  assert(evt.name === "delete-file")
  assertEquals(evt.file.rel, "b1.html")
})

test("it queries for associated pages", async () => {
  // TODO:
})

test("it warns when a template throws an error during compilation", async () => {
  const pages = new Pages(evts)
  evts.reset()

  const path = src.join("./e1.p.html")
  await pages.change(FileRef.init(path))

  await pages.render()
  assertLength(evts.all, 1)

  const evt = evts.all[0]
  assert(evt.name === "show-warning")
  assertIncludes(
    evt.msg,
    "the template 'e1.p.html' threw an error during compilation"
  )
  assertInstanceOf(evt.cause, Error)
})
