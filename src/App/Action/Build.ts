import { Config } from "../Config/mod.ts"
import { Action } from "./Action.ts"
import { PageRepo } from "../Page/mod.ts"
import { SaveFile } from "../File/mod.ts"

// compile every page (.p.html) and write them to disk
export class Build implements Action {
  // -- module --
  static get = () => new Build()

  // -- props --
  #cfg: Config
  #files: PageRepo

  // -- lifetime --
  constructor(cfg = Config.get(), files = PageRepo.get()) {
    this.#cfg = cfg
    this.#files = files
  }

  // -- commands --
  async call() {
    // parse every layout
    const layouts = this.#files.findLayouts()
    await Promise.all(layouts.map((t) => t.parse()))

    // parse every page
    const pages = this.#files.findPages()
    await Promise.all(pages.map((p) => p.parse()))

    // compile every page and write it to disk
    for (const page of pages) {
      const file = page.compile()
      const save = new SaveFile(file)
      save.call()
    }
  }
}
