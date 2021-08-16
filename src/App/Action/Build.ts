import { Config } from "../Config/mod.ts"
import { Action } from "./Action.ts"
import { PageRepo } from "../Page/mod.ts"
import { FileEvents, FileEvent } from "../File/mod.ts"

// compile every page (.p.html) and write them to disk
export class Build implements Action {
  // -- module --
  static get = () => new Build()

  // -- props --
  #cfg: Config
  #pages: PageRepo
  #evts: FileEvents

  // -- lifetime --
  constructor(cfg = Config.get(), pages = PageRepo.get(), evts = FileEvents.get()) {
    this.#cfg = cfg
    this.#pages = pages
    this.#evts = evts
  }

  // -- commands --
  async call() {
    // parse every layout
    const layouts = this.#pages.findLayouts()
    await Promise.all(layouts.map((t) => t.parse()))

    // parse every page
    const pages = this.#pages.findPages()
    await Promise.all(pages.map((p) => p.parse()))

    // compile every page and write it to disk
    for (const page of pages) {
      const file = page.compile()
      this.#evts.add(FileEvent.saveFile(file))
    }
  }
}
