import { stubLog, stubConfig, stubEvents, assert, assertEquals, assertLength, assertIncludes, assertInstanceOf, assertMatch } from "../../Test/mod.ts"
import { TemplateEvent, Templates } from "../../Core/mod.ts";
import { FileRef } from "../File/mod.ts"
import { Pages } from "./Pages.ts"

// -- setup --
const { test } = Deno

// stub globals
stubLog()
const cfg = stubConfig()

// stub deps
const evts = stubEvents()
const tmplEvts = stubEvents<TemplateEvent>({ isLive: true })
const tmpl: typeof Templates.get = (match) => new Templates(match, tmplEvts)

// find paths
const src = cfg.paths.src

// -- tests --
function beforeEach() {
  evts.reset()
  tmplEvts.reset()
}

test("it links a page and layout", async () => {
  beforeEach()
  const pages = new Pages(tmpl, evts)

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
  beforeEach()
  const pages = new Pages(tmpl, evts)

  await pages.change(FileRef.init(src.join("./b1.p.html")))
  await pages.change(FileRef.init(src.join("./bz.l.html")))
  await pages.change(FileRef.init(src.join("./links.d.json")))

  pages.delete(FileRef.init(src.join("./b1.p.html")))
  pages.delete(FileRef.init(src.join("./links.d.json")))

  assertLength(evts.all, 1)

  const evt = evts.all[0]
  assert(evt.name === "delete-file")
  assertEquals(evt.file.rel, "b1.html")
})

test("it queries for associated pages", async () => {
  beforeEach()
  const pages = new Pages(tmpl, evts)

  await pages.change(FileRef.init(src.join("./bz.l.html")))
  await pages.change(FileRef.init(src.join("./c1.p.html")))
  await pages.change(FileRef.init(src.join("./c1/one.p.html")))

  await pages.render()
  assertLength(evts.all, 2)

  let evt = evts.all[0]
  assert(evt.name === "save-file")
  assertEquals(evt.file.path.rel, "c1/one.html")

  evt = evts.all[1]
  assert(evt.name === "save-file")
  assertEquals(evt.file.path.rel, "c1.html")
  assertMatch(evt.file.text, /one title/)
})

test("it warns when a template throws an error during compilation", async () => {
  beforeEach()
  const pages = new Pages(tmpl, evts)

  const path = src.join("./e1.p.html")
  await pages.change(FileRef.init(path))

  await pages.render()
  assertLength(evts.all, 1)

  const evt = evts.all[0]
  assert(evt.name === "show-warning")
  assertIncludes(evt.msg, "the template 'e1.p.html' threw an error during compilation")
  assertInstanceOf(evt.cause, Error)
})
