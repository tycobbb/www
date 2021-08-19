import { lazy, Path } from "../../Core/mod.ts"
import { Config } from "../Config/mod.ts"
import { Event, Events, EventStream } from "../Event/mod.ts"
import { Page } from "./Page.ts"
import { Layout } from "./Layout.ts"
import { Partial } from "./Partial.ts"

// -- constants --
const kLayoutPattern = /^\s*layout:\s*(\S+)\s*$/

// -- types --
type Table<T>
  = {[key: string]: T}

type Pending = {
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
  #db: {
    pages: Table<Page>,
    layouts: Table<Layout>
  }

  #pending: Pending[] = []

  // -- lifetime --
  constructor(
    cfg = Config.get(),
    evts: Events = EventStream.get(),
  ) {
    this.#cfg = cfg
    this.#evts = evts
    this.#db = {
      pages: {},
      layouts: {},
    }
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
      kind: this.#detectKindForPath(path),
      path
    })
  }

  // remove the page or layout for this path, if one exists
  deletePath(path: Path): void {
    const id = path.relative

    // if this matches a page, delete it
    const page = this.#db.pages[id]
    if (page != null) {
      delete this.#db.pages[id]
      return
    }

    // otherwise, if it matches a layout, delete it
    // TODO: what to do with pages depending on this layout (maybe nothing)
    const layout = this.#db.layouts[id]
    if (layout != null) {
      delete this.#db.layouts[id]
    }
  }

  // resolves any pending paths and compiles dirty pages
  async compile(): Promise<void> {
    // process all the pending nodes, emitting events for basic files and
    // updating the graph nodes (pages, layouts)
    for (const n of this.#pending) {
      switch (n.kind) {
      case "dir":
        await this.#evts.add(Event.copyDir(n.path)); break
      case "file":
        await this.#evts.add(Event.copyFile(n.path)); break
      case "page":
        await this.#createOrModifyPageAtPath(n.path); break;
      case "layout":
        await this.#createOrModifyLayoutAtPath(n.path); break;
      }
    }

    // clear pending nodes
    this.#pending = []

    // mark any pages whose layout is also dirty
    const pages = Object.values(this.#db.pages)
    for (const page of pages) {
      page.inferMarkFromParent()
    }

    // compile every dirty page (do this after marking all the pages as dirty,
    // since compilation clears the flag)
    for (const page of pages) {
      if (page.isDirty) {
        const file = page.compile()
        this.#evts.add(Event.saveFile(file))
      }
    }
  }

  // -- c/helpers
  // create the page at path, or mark the existing page as dirty
  async #createOrModifyPageAtPath(path: Path) {
    const id = path.relative

    // decode partial
    const partial = await Partial.read(path)

    // find layout, creating it if necessary
    const lpath = this.#detectLayoutPathForPage(partial)
    const layout = this.#findOrCreateLayoutAtPath(lpath)

    // find or create the page
    let page = this.#db.pages[id]
    if (page != null) {
      page.rebuild(partial, layout)
    } else {
      page = new Page(path, partial, layout)
      this.#db.pages[id] = page
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
    let layout = this.#db.layouts[id]
    if (layout != null) {
      layout.rebuild(partial)
    } else {
      layout = new Layout(path, partial)
      this.#db.layouts[id] = layout
    }

    // mark it as dirty
    layout.mark()

    return layout
  }

  // -- queries --
  // find or create the layout at a path; a layout created by this method
  // is a stub (has no partial).
  #findOrCreateLayoutAtPath(path: Path): Layout {
    const id = path.relative

    let layout = this.#db.layouts[id]
    if (layout == null) {
      layout = new Layout(path, null)
      this.#db.layouts[id] = layout
    }

    return layout
  }

  // detect pending node kind from path
  #detectKindForPath(path: Path): Pending["kind"] {
    switch (path.extension()) {
    case ".p.html":
      return "page"
    case ".l.html":
      return "layout"
    default:
      return "file"
    }
  }

  // detect the layout path given a page's partial
  #detectLayoutPathForPage(partial: Partial): Path {
    // extract the layout path
    let path: Path

    // extract the layout path, if any, from the file
    const match = partial.getHeaderComment()?.match(kLayoutPattern) || []
    if (match != null && match.length == 2) {
      path = this.#cfg.paths.src.join(match[1])
    } else {
      path = this.#cfg.paths.layout
    }

    return path
  }
}
