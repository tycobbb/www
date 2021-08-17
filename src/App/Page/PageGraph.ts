import { lazy, Path } from "../../Core/mod.ts"
import { Config } from "../Config/mod.ts"
import { Event, Events, EventStream } from "../Event/mod.ts"
import { Page } from "./Page.ts"
import { Layout } from "./Layout.ts"
import { Partial } from "./Partial.ts"

// -- constants --
const kLayoutPattern = /^\s*<!--\s*layout:\s*(\S+)\s*-->\n/

// -- types --
type PendingNode = {
  kind: "dir" | "file" | "layout" | "page"
  path: Path
}

// -- impls -
export class PageGraph {
  // -- module --
  static readonly get = lazy(() => new PageGraph())

  // -- deps --
  #cfg: Config
  #evts: Events

  // -- props --
  #pages: Page[] = []
  #pagesById: {[key: string]: Page} = {}
  #layouts: {[key: string]: Layout} = {}
  #layoutsById: {[key: string]: Layout} = {}
  #pending: PendingNode[] = []

  // -- lifetime --
  constructor(cfg = Config.get(), evts: Events = EventStream.get()) {
    this.#cfg = cfg
    this.#evts = evts
  }

  // -- commands --
  // add a pending path to a dir
  addPathToDir(path: Path): void {
    this.#pending.push({
      kind: "dir",
      path
    })
  }

  // add a pending path to a file, inferring type from extension
  addPathToFile(path: Path): void {
    this.#pending.push({
      kind: this.#detectKind(path),
      path
    })
  }

  // detect pending node kind from path
  #detectKind(path: Path): PendingNode["kind"] {
    switch (path.extension()) {
    case ".p.html":
      return "page"
    case ".l.html":
      return "layout"
    default:
      return "file"
    }
  }

  // add a page to the repo by path
  addPage(path: Path) {
    // this.#pages.push(new Page(path))
  }

  // add a layout to the repo by path
  addLayout(path: Path) {
    // this.#layouts[path.str] = new Layout(path)
  }

  // resolves any pending paths
  resolve() {
    // process all the pending nodes, emitting events for basic files and updating
    // the dirty parts of the graph for everything else
    for (const n of this.#pending) {
      switch (n.kind) {
      case "dir":
        this.#evts.add(Event.copyDir(n.path)); break
      case "file":
        this.#evts.add(Event.copyFile(n.path)); break
      case "page":
        this.#createOrModifyPageAtPath(n.path); break;
      case "layout":
        this.#createOrModifyLayoutAtPath(n.path); break;
      }
    }

    // clear pending nodes
    this.#pending = []

    // mark any pages with a dirty layout as dirty
    for (const page of Object.values(this.#pagesById)) {
      page.inferMarkFromParent()
    }

    // // parse every layout
    // const layouts = this.#pending.layouts.map((p) => {
    //   return this.#findOrCreateLayoutByPath(p)
    // })

    // await Promise.all(layouts.map((l) => l.parse()))

    // this.#pending.layouts = []

    // // parse every page
    // // parse every layout
    // const pages = this.#pending.pages.map((p) => {
    //   return this.#findOrCreatePageByPath(p)
    // })

    // await Promise.all(pages.map((p) => p.parse()))

    // this.#pending.pages = []
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

  // create the page at path, or mark the existing page as dirty
  async #createOrModifyPageAtPath(path: Path) {
    const id = path.relative

    // decode partial
    const partial = await Partial.read(path)

    // locate layout
    const layout = new Layout(path, partial)

    // find or create the page
    let page = this.#pagesById[id]
    if (page != null) {
      page.rebuild(partial, layout)
    } else {
      page = new Page(path, partial, layout)
      this.#pagesById[id] = page
    }

    // mark it as dirty
    page.mark()

    return page
  }

  // create the layout at path, or mark the existing layout as dirty
  async #createOrModifyLayoutAtPath(path: Path) {
    const id = path.relative

    // reparse partial
    const partial = await Partial.read(path)

    // find or create the layout
    let layout = this.#layoutsById[id]
    if (layout != null) {
      layout.rebuild(partial)
    } else {
      layout = new Layout(path, partial)
      this.#layoutsById[id] = layout
    }

    // mark it as dirty
    layout.mark()

    return layout
  }
}
