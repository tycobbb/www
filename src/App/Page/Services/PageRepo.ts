import { lazy, Path } from "../../../Core/mod.ts"
import { Config } from "../../Config/mod.ts"
import { Page } from "./../Page.ts"
import { Layout } from "./../Layout.ts"

export class PageRepo {
  // -- module --
  static readonly get = lazy(() => new PageRepo())

  // -- deps --
  #cfg: Config

  // -- props --
  #pages: Page[] = []
  #layouts: {[key: string]: Layout} = {}

  // -- lifetime --
  constructor(cfg = Config.get()) {
    this.#cfg = cfg
  }

  // -- commands --
  // add a page to the repo by path
  addPage(path: Path) {
    this.#pages.push(new Page(path))
  }

  // add a layout to the repo by path
  addLayout(path: Path) {
    this.#layouts[path.str] = new Layout(path)
  }

  // -- c/mutations
  // -- queries --
  // find all the pages
  findPages(): Page[] {
    return this.#pages
  }

  // find all the layouts
  findLayouts(): Layout[] {
    return Object.values(this.#layouts)
  }

  // find the layout at the given path; throws an error if no such layout exists
  findLayoutByPath(path: Path): Layout {
    const layout = this.#layouts[path.str]
    if (layout == null) {
      throw new Error(`could not find layout at ${path}`)
    }

    return layout
  }
}
