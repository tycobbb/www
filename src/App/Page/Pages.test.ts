import { stubLog, stubConfig, stubEvents, assert, assertEquals, assertNotEquals, assertLength, assertIncludes, assertMatch } from "../../Test/mod.ts"
import { TemplateEvent, Templates } from "../../Core/mod.ts";
import { FileRef } from "../File/mod.ts"
import { Pages } from "./Pages.ts"
import { decodeJson, decodeTw } from "../../Core/Decode/mod.ts";

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
function initPages(): Pages {
  evts.reset()
  tmplEvts.reset()

  const pages = new Pages(tmpl, evts)
  pages.addDataType({ format: "json", decode: decodeJson })
  pages.addDataType({ format: "tw", decode: decodeTw })

  return pages
}

test("it links a page and layout", async () => {
  const pages = initPages()

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

test("it queries for associated pages", async () => {
  const pages = initPages()

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

test("it decodes known data file types", async () => {
  const pages = initPages()

  await pages.change(FileRef.init(src.join("./links.d.json")))
  await pages.change(FileRef.init(src.join("./posts.d.tw")))
  await pages.change(FileRef.init(src.join("./unkwn.d.xml")))

  const evt = evts.all[0]
  assert(evt.name === "show-warning")
  assertIncludes(evt.msg, "the format 'xml' is not a registered data type")
})

test("it deletes nodes w/ a compiled representation", async () => {
  const pages = initPages()

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

test("it warns when a template throws an error during compilation", async () => {
  const pages = initPages()

  const path = src.join("./e2.p.html")
  await pages.change(FileRef.init(path))

  await pages.render()
  assertLength(evts.all, 1)

  const evt = evts.all[0]
  assert(evt.name === "show-warning")
  assertIncludes(evt.msg, "the template 'e2.p.html' threw an error during compilation")
  assertNotEquals(evt.cause, null)
})

test("it warns when a template throws an error during rendering", async () => {
  const pages = initPages()

  const path = src.join("./e1.p.html")
  await pages.change(FileRef.init(path))

  await pages.render()
  assertLength(evts.all, 1)

  const evt = evts.all[0]
  assert(evt.name === "show-warning")
  assertIncludes(evt.msg, "the template 'e1.p.html' threw an error during rendering")
  assertNotEquals(evt.cause, null)
})
