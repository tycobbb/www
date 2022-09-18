import { single } from "../../Core/Scope.ts"
import { Path, Ref, Templates, TemplateEvent } from "../../Core/mod.ts"
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
    m.#tmpl.on(m.#onTemplateEvent.bind(m))
  }

  // -- commands --
  // add a pending path to a file, inferring type from extension
  async change(file: FileRef): Promise<void> {
    const m = this

    // find the node
    const id = file.path.rel
    const ref = this.#db.nodes[id]

    // if missing, create the node
    if (ref == null) {
      await m.#create(id, file)
    }
    // otherwise, flag it as changed
    else {
      ref.deref()!.flag()
    }
  }

  // create a new node with an id and file
  async #create(id: string, file: FileRef): Promise<void> {
    const m = this

    // add it to the databse
    const node = new PageNode(id, file)
    m.#db.nodes[id] = new Ref(node)

    // do extra work based on kind
    const type = file.kind.type

    if (type === "page") {
      node.flag()
    }
    // otherwise, add it to the templates
    else {
      m.#tmpl.add(id, await node.read())

      // if it's data, also render it so that it's available on first compile
      if (type === "data") {
        await m.#renderData(node)
      }
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

  // renders any dirty pages
  async render(): Promise<void> {
    const m = this

    // get initial list of dirty nodes
    const initial = Object.values(m.#db.nodes)
      .map((r) => r.deref()!)
      .filter((n) => n.isDirty)

    // process iteratively until all nodes are finished
    const dirty = new Set(initial)
    while (dirty.size !== 0) {
      // for all remaining dirty nodes
      for (const node of Array.from(dirty)) {
        // if waiting on dependencies, skip
        if (!node.isReady) {
          continue
        }

        // get id
        const id = node.id

        // refresh its template
        m.#tmpl.add(id, await node.read())

        // do extra work based on kind
        switch (node.kind.type) {
        case "data":
          await m.#renderData(node); break
        case "page":
          await m.#renderPage(node); break
        }

        // clear its flag
        node.clear()

        // and finish processing this node
        dirty.delete(node)
      }
    }
  }

  // render data and add it to the template repo
  async #renderData(node: PageNode): Promise<void> {
    const m = this

    // grab id
    const id = node.id

    // render the data into json
    const text = await m.#tmpl.render(id)
    const json = JSON.parse(text)

    // add it as template data
    m.#tmpl.addData(id, json)
  }

  // render the page and emit it as a file
  async #renderPage(node: PageNode): Promise<void> {
    const m = this

    // render the page to string
    const text = await m.#tmpl.render(node.id)

    // create the page
    const page = new Page(node.path, text)
    const file = page.render()

    // save the file
    m.#evts.send(Event.saveFile(file))
  }

  // add a dependency between two nodes
  #addDep(child: string, parent: string) {
    const m = this

    // get page nodes
    const cn = m.#db.nodes[child]
    const pn = m.#db.nodes[parent]

    // fail if either is missing
    if (cn == null || pn == null) {
      throw new Error(`failed to add dep ${child}=${cn} <=> ${parent}=${pn}`)
    }

    // add dependency between nodes
    cn.deref()!.addDependent(pn)
    pn.deref()!.addDependency(cn)
  }

  // -- events --
  // when an app event happens
  #onEvent(evt: Event) {
    const m = this

    switch (evt.name) {
    case "delete-file":
      m.delete(evt.file); break;
    }
  }

  // when a template event happens
  #onTemplateEvent(evt: TemplateEvent) {
    if (evt.name === "include") {
      this.#addDep(evt.child, evt.parent)
    }
  }
}
