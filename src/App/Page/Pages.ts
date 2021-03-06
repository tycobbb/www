import { single } from "../../Core/Scope.ts"
import { Path, Ref, Templates, IncludeEvent } from "../../Core/mod.ts"
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
  static readonly get = single(() => new Pages())

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
    m.#evts.on(m.#onEvent.bind(m))
    m.#tmpl.on(m.#onInclude.bind(m))
  }

  // -- commands --
  // add a pending path to a file, inferring type from extension
  change(file: FileRef): void {
    const m = this

    // get the db id
    const id = file.path.rel

    // find or create the node
    let ref = this.#db.nodes[id]
    if (ref == null) {
      ref = new Ref(new PageNode(id, file))
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
    const id = path.rel

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

      // create the page
      const page = new Page(node.path, text)
      const file = page.render()

      // save the file
      m.#evts.send(Event.saveFile(file))
    }
  }

  // add a dependency between two nodes
  #addDep(child: string, parent: string) {
    const m = this

    // get page nodes
    const nc = m.#db.nodes[child]
    const np = m.#db.nodes[parent]

    // fail if either is missing
    if (nc == null || np == null) {
      throw new Error(`failed to add dep ${child}=${nc} => ${parent}=${np}`)
    }

    // add parent as a dependent
    nc.deref()!.addDependent(np)
  }

  // -- events --
  // when an app event happens
  #onEvent(evt: Event) {
    const m = this

    switch (evt.kind) {
    case "delete-file":
      m.delete(evt.file); break;
    }
  }

  // when an include event happens
  #onInclude(evt: IncludeEvent) {
    this.#addDep(evt.child, evt.parent)
  }
}
