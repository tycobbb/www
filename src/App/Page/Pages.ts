import { single } from "../../Core/Scope.ts"
import { Ref, Templates, TemplateEvent, log } from "../../Core/mod.ts"
import { FileRef } from "../File/mod.ts"
import { Event, Events } from "../Event/mod.ts"
import { Page } from "./Page.ts"
import { PageNode } from "./PageNode.ts"
import { PageIndex } from "./PageIndex.ts"

// -- types --
type Table<T> = { [key: string]: T }

// -- impls -
export class Pages {
  // -- module --
  static readonly get = single(() => new Pages())

  // -- deps --
  // a stream of file events
  #evts: Events

  // the template renderer
  #tmpl: Templates

  // -- props --
  // an index of page nodes
  #index: PageIndex

  // -- lifetime --
  constructor(evts = Events.get(), tmpl = Templates.get()) {
    const m = this

    // set deps
    this.#evts = evts
    this.#tmpl = tmpl

    // set props
    this.#index = new PageIndex()

    // listen to file events
    m.#tmpl.on(m.#onTemplateEvent.bind(m))
  }

  // -- commands --
  // add a pending path to a file, inferring type from extension
  async change(file: FileRef): Promise<void> {
    const m = this

    // find the node
    const id = file.path.rel
    const node = m.#index.get(id)

    // if missing, create the node
    if (node == null) {
      await m.#create(id, file)
    }
    // otherwise, flag it as changed
    else {
      node.val.flag()
    }
  }

  // create a new node with an id and file
  async #create(id: string, file: FileRef): Promise<void> {
    const m = this

    // add it to the databse
    const node = new PageNode(id, file)
    m.#index.add(node)

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
  delete(file: FileRef): void {
    const m = this

    // get the db id
    const id = file.path.rel

    // get the node
    if (m.#index.get(id) == null) {
      log.e(`x [pges] tried to delete node '${id}', but it does not exist`)
      return
    }

    // delete the template
    m.#tmpl.delete(id)

    // delete the node from the index
    m.#index.delete(id)

    // if this node has a compiled representation, delete it
    if (file.kind.type === "page") {
      m.#evts.send(Event.deleteFile(file.path.setExt("html")))
    }
  }

  // renders any dirty pages
  async render(): Promise<void> {
    const m = this

    // get initial list of dirty nodes
    const initial = new Set(m.#index
      .all
      .map((n) => n.val)
      .filter((n) => n.isDirty)
    )

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

        // render the node if necessary
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
    const data = JSON.parse(text) as unknown

    // add it as template data
    m.#tmpl.addData(id, data)

    // log debug message
    log.d(`d [pges] add: ${id}\n${text}`)
  }

  // render the page and emit it as a file
  async #renderPage(node: PageNode): Promise<void> {
    const m = this

    // render the page to string
    let text
    try {
      text = await m.#tmpl.render(node.id)
    } catch (err) {
      m.#evts.send(
        Event.showWarning(
          `the template '${node.path.rel}' threw an error during compilation`,
          err
        )
      )

      return
    }

    // render the page
    const page = new Page(text)
    const html = page.render()

    // and emit a new copy
    m.#evts.send(
      Event.saveFile({
        path: node.path.setExt("html"),
        text: html,
      })
    )
  }

  // add a dependency between two nodes
  #addDep(childId: string, parentId: string) {
    const m = this

    // get page nodes
    const cn = m.#index.get(childId)
    const pn = m.#index.get(parentId)

    // fail if either is missing
    if (cn == null || pn == null) {
      throw new Error(`failed to add dep ${childId}=${cn} <=> ${parentId}=${pn}`)
    }

    // add dependency between nodes
    cn.val.addDependent(pn)
    pn.val.addDependency(cn)
  }

  // -- events --
  // when a template event happens
  #onTemplateEvent(evt: TemplateEvent) {
    if (evt.name === "include") {
      this.#addDep(evt.child, evt.parent)
    }
  }
}
