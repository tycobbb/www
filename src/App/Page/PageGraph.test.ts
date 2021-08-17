import { stubConfig, stubEvents, assertEquals, assertLength } from "../../Test/mod.ts"
import { PageGraph } from "./PageGraph.ts"

// -- setup --
const { test } = Deno

// stub config
const cfg = stubConfig()
const evts = stubEvents()

// build paths
const src = cfg.paths.src

// -- tests --
test("PageGraph ~ it links a page and layout", async () => {
  const pages = new PageGraph(cfg, evts)
  pages.addPathToFile(src.join("./bz.l.html"))
  pages.addPathToFile(src.join("./b1.p.html"))

  await pages.compile()
  assertLength(evts.all, 1)
  assertEquals(evts.all[0].kind, "save-file")
})
