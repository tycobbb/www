import { lazy, Path, Templates } from "../../Core/mod.ts"
import { Config } from "../Config/mod.ts"
import { FileRef } from "../File/mod.ts"
import { Event, Events } from "../Event/mod.ts"
import { Page } from "./Page.ts"
import { PageNode } from "./PageNode.ts"

// -- constants --
// matches the layout magic comment
const kLayoutPattern = /\s*<!--\s*layout:\s*(\S+)\s*-->\s*/

// -- types --
type Table<T>
  = {[key: string]: T}

  // -- impls -
export class PageGraph {
  // -- module --
  static readonly get = lazy(() => new PageGraph())

  // -- deps --
  // the config
  #cfg: Config

  // a stream of file events
  #evts: Events

  // the template renderer
  #tmpl: Templates

  // -- props --
  // a database of nodes keyed by path
  #db: {
    nodes: Table<PageNode>,
  }

  // -- lifetime --
  constructor(
    cfg = Config.get(),
    evts = Events.get(),
    tmpl = Templates.get(),
  ) {
    const m = this

    // set deps
    this.#cfg = cfg
    this.#evts = evts
    this.#tmpl = tmpl

    // set props
    this.#db = {
      nodes: {},
    }

    // listen to file events
    m.#evts.on(m.#onEvent)
  }

  // -- commands --
  // add a pending path to a file, inferring type from extension
  change(file: FileRef): void {
    const m = this

    // get the db id
    const id = file.path.str

    // find or create the node
    let node = this.#db.nodes[id]
    if (node == null) {
      node = new PageNode(file)
      m.#db.nodes[id] = node
    }

    // flag it as changed
    node.mark()
  }

  // remove the page or layout for this path, if one exists
  delete(path: Path): void {
    const m = this

    // get the db id
    const id = path.str

    // delete this node & template
    // TODO: what to do with pages depending on this layout (maybe nothing)
    delete m.#db.nodes[id]
    m.#tmpl.delete(id)
  }

  // resolves any pending paths and compiles dirty pages
  async compile(): Promise<void> {
    const m = this

    // collect ids dirty pages for rendering
    const pageIds: string[] = []

    // recompile every dirty node
    for (const id in m.#db.nodes) {
      const node = m.#db.nodes[id]
      if (!node.isDirty) {
        return
      }

      // refresh its template
      m.#tmpl.add(id, await node.read())

      // if it's a page, add to render list
      if (node.kind === "page") {
        pageIds.push(id)
      }

      // clear its flag
      node.clear()
    }

    // for each page
    for (const id of pageIds) {
      // render the page to string
      const node = m.#db.nodes[id]
      const text = await m.#tmpl.render(id)

      // create the pege
      const page = new Page(node.path, text)
      const file = page.render()

      // save the file
      m.#evts.add(Event.saveFile(file))
    }
  }

  // -- events --
  // listen to file events
  #onEvent(evt: Event) {
    const m = this

    switch (evt.kind) {
    case "delete-file":
      m.delete(evt.file); break;
    }
  }
}
