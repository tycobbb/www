import { Templates, TemplateEvent, log, single } from "../../Core/mod.ts"
import { FileRef } from "../File/mod.ts"
import { Event, Events } from "../Event/mod.ts"
import { Page } from "./Page.ts"
import { PageNode } from "./PageNode.ts"
import { PageIndex } from "./PageIndex.ts"
import { PageDataTypes, PageDataType } from "./PageDataTypes.ts";

// -- impls --
// the page graph
export class Pages {
  // -- module --
  static readonly get = single(() => new Pages())

  // -- deps --
  // a bus for app events
  #evts: Events

  // the template renderer
  #tmpl: Templates

  // -- props --
  // an index of page nodes & cursors
  #index: PageIndex

  // a map of data decode fns by file ext
  #dataTypes: PageDataTypes

  // -- lifetime --
  constructor(
    tmpl = Templates.get,
    evts = Events.get()
  ) {
    const m = this

    // set props
    this.#index = new PageIndex()
    this.#dataTypes = new PageDataTypes()

    // set deps
    this.#evts = evts
    this.#tmpl = tmpl(m.#index.match.bind(m.#index))

    // listen to template events
    m.#tmpl.on(m.#onTemplateEvent.bind(m))
  }

  // -- commands --
  // add a pending path to a file, inferring type from extension
  async change(file: FileRef): Promise<void> {
    const m = this

    // find the node
    const node = m.#index.get(PageNode.id(file))

    // if missing, create the node
    if (node == null) {
      await m.#create(file)
    }
    // otherwise, flag it as changed
    else {
      node.val.flag()
    }
  }

  // create a new node with an id and file
  async #create(file: FileRef): Promise<void> {
    const m = this

    // add it to the databse
    const node = new PageNode(file)
    m.#index.add(node)

    // do extra work based on kind
    const type = file.kind.type

    if (type === "page") {
      node.flag()
    }
    // otherwise, add it to the templates
    else {
      // TODO: this will catch compilation errors; it's not clear what that might be for a data file
      // add & compile its template
      await m.#compile(node)

      // if it's data, also render it so that it's available on first compile
      // TODO: make data deferrable
      if (type === "data") {
        await m.#renderData(node)
      }
    }
  }

  // compiles and caches the template for a node. if compilation fails, returns false
  async #compile(node: PageNode): Promise<boolean> {
    const m = this

    try {
      m.#tmpl.add(node.id, await node.read())
    } catch (err) {
      m.#warn(`the template '${node.path.rel}' threw an error during compilation`, err)
      return false
    }

    return true
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
        if (!node.isReady()) {
          continue
        }

        // add & compile its template
        const isCompiled = await m.#compile(node)

        // if compiled, render the node
        if (isCompiled) {
          const isRendered = await m.#renderNode(node)

          // if rendering short-circuited, don't clear
          if (!isRendered) {
            continue
          }
        }

        // clear its flag
        node.clear()

        // and finish processing this node
        dirty.delete(node)
      }
    }
  }

  // render the node
  async #renderNode(node: PageNode): Promise<boolean> {
    const m = this

    switch (node.kind.type) {
    case "data":
      return await m.#renderData(node)
    case "page":
      return await m.#renderPage(node)
    default:
      return Promise.resolve(true)
    }
  }

  // render data and add it to the template repo
  async #renderData(node: PageNode): Promise<boolean> {
    const m = this

    // grab id
    const id = node.id

    // render the data into json
    const text = await m.#tmpl.render(id)

    let data: unknown
    try {
      data = m.#dataTypes.decode(node.kind.format, text)
    } catch (err) {
      if (err instanceof PageDataTypes.MissingType) {
        m.#warn(`the format '${node.kind.format}' is not a registered data type`, err)
        return false
      }

      throw err
    }

    // add it as template data
    m.#tmpl.addData(id, data)

    // log debug message
    log.d(`d [pges] add: ${id}\n${text}`)

    return true
  }

  // render the page and emit it as a file
  async #renderPage(node: PageNode): Promise<boolean> {
    const m = this

    // render the page to string
    let text
    try {
      text = await m.#tmpl.render(node.id)
    } catch (err) {
      m.#warn(`the template '${node.path.rel}' threw an error during rendering`, err)
      return true
    }

    // rendering might create a query or data dependency causing the page to no
    // longer be renderable
    if (!node.isReady()) {
      return false
    }

    // render the page
    const page = new Page(text)
    const pageRender = page.render()

    // store the data
    m.#tmpl.addPageData(node.id, pageRender.data)

    // and emit a new copy
    m.#evts.send(
      Event.saveFile({
        path: node.path.setExt("html"),
        text: pageRender.html,
      })
    )

    return true
  }

  // add a dependency between two nodes
  #addDep(childId: string, parentId: string) {
    const m = this

    // get the page nodes
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

  // add a query to the dependency to the node
  #addQuery(query: string, parentId: string) {
    const m = this

    // get the page node
    const pn = m.#index.get(parentId)
    if (pn == null) {
      throw new Error(`failed to add query ${query} <=> ${parentId}=${pn}`)
    }

    // get the query dependency
    const cursor = m.#index.query(query)
    pn.val.addDependency(cursor)
  }

  // show a warning cli message
  #warn(message: string, cause?: Error) {
    this.#evts.send(Event.showWarning(message, cause))
  }

  // -- events --
  // when a template event happens
  #onTemplateEvent(evt: TemplateEvent) {
    switch (evt.name) {
      case "include":
        this.#addDep(evt.child, evt.parent); break
      case "query":
        this.#addQuery(evt.query, evt.parent); break
    }
  }

  // -- config --
  // register a data type & decode fn
  addDataType(dataType: PageDataType) {
    this.#dataTypes.add(dataType)
  }
}
