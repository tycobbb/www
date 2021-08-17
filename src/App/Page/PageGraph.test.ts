import { stubConfig, stubEvents, assertEquals, assertIncludes } from "../../Test/mod.ts"
import { PageGraph } from "./PageGraph.ts"

// -- setup --
const { test } = Deno

// stub config
const cfg = stubConfig()
const evts = stubEvents()

// build paths
const src = cfg.paths.src

// -- tests --
test("PageGraph ~ it adds files", () => {
  const pages = new PageGraph(cfg, evts)
  pages.addPathToDir(src.join("./one"))
  pages.addPathToFile(src.join("./a1.html"))
})
