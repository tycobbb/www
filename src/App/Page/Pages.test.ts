import { stubConfig, stubEvents, assertEquals, assertLength } from "../../Test/mod.ts"
import { File, FileRef } from "../File/mod.ts"
import { Pages } from "./Pages.ts"

// -- setup --
const { test } = Deno

// stub config
const cfg = stubConfig()
const evts = stubEvents()

// build paths
const src = cfg.paths.src

// -- tests --
test("it links a page and layout", async () => {
  const pages = new Pages(cfg, evts)
  evts.reset()
  await pages.change(FileRef.init(src.join("./bz.l.html")))
  await pages.change(FileRef.init(src.join("./link.f.html")))
  await pages.change(FileRef.init(src.join("./links.d.json")))
  await pages.change(FileRef.init(src.join("./b1.p.html")))

  await pages.render()
  assertLength(evts.all, 1)

  const evt = evts.all[0]
  assertEquals(evt.name, "save-file")
  assertEquals((<File>evt.file).path.rel, "b1.html")
})