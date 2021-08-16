import { stubConfig, assertEquals, assertIncludes } from "../../Test/mod.ts"
import { Page } from "./Page.ts"
import { PageRepo } from "./Services/mod.ts"

// -- setup --
const { test } = Deno

// stub config
const cfg = stubConfig()

// build paths
const src = cfg.paths.src
const paths = {
  page: src.join("./b1.p.html"),
  layout: src.join("./bz.l.html"),
}

// -- tests --
test("Page ~ it compiles", async () => {
  const pages = new PageRepo()
  pages.addLayout(paths.layout)

  const layout = pages.findLayoutByPath(paths.layout)
  await layout.parse()

  const page = new Page(paths.page)
  await page.parse(cfg, pages)

  const file = page.compile()
  assertEquals(file.path.relative, "b1.html")
  assertIncludes(file.text, "<title>base</title>")
  assertIncludes(file.text, "<p class=\"test\">hello, test.</p>")
})
