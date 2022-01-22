import { lazy, Path, Ref, Templates } from "../../Core/mod.ts"
import { Config } from "../Config/mod.ts"
import { FileRef } from "../File/mod.ts"
import { Event, Events } from "../Event/mod.ts"
import { Page } from "./Page.ts"
import { PageNode } from "./PageNode.ts"

// -- types --
type Table<T>
  = {[key: string]: T}

  // -- impls -
export class Pages {
  // -- module --
  static readonly get = lazy(() => new Pages())

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
    nodes: Table<Ref<PageNode>>,
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
    let ref = this.#db.nodes[id]
    if (ref == null) {
      ref = new Ref(new PageNode(file))
      m.#db.nodes[id] = ref
    }

    // flag it as changed
    const node = ref.deref()
    if (node != null) {
      node.flag()
    }
  }

  // remove the page or layout for this path, if one exists
  // TODO: what to do with nodes depending on a deleted node?
  delete(path: Path): void {
    const m = this

    // get the db id
    const id = path.str

    // get the node
    const ref = m.#db.nodes[id]
    if (ref == null) {
      // TODO: already deleted, this should probably warn
      return
    }

    // delete the reference so other nodes remove it from their dependents
    ref.delete()

    // delete the template
    m.#tmpl.delete(id)

    // remove it from the db
    delete m.#db.nodes[id]
  }

  // resolves any pending paths and compiles dirty pages
  async compile(): Promise<void> {
    const m = this

    // collect ids dirty pages for rendering
    const pageIds: string[] = []

    // recompile every dirty node
    for (const id in m.#db.nodes) {
      // the node should never be null; this class manages the ref
      const node = m.#db.nodes[id].deref()!
      if (!node.isDirty) {
        continue
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
      const node = m.#db.nodes[id].deref()!
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
