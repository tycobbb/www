import { Index, Ref } from "../../Core/mod.ts";
import { FileRef } from "../File/mod.ts";
import { PageCursor } from "./PageCursor.ts";
import { PageNode } from "./PageNode.ts";

// -- impls --
export class PageIndex {
  // -- props --
  // a map of nodes
  #nodes: Index<Ref<PageNode>> = new Map()

  // a map of paths to active cursors
  #cursors: Index<Ref<PageCursor>> = new Map()

  // -- commands --
  // add a new node
  add(node: PageNode) {
    const m = this

    // add the node
    const ref = new Ref(node)
    m.#nodes.set(node.id, new Ref(node))

    // add the node to any cursors
    for (const cursor of m.#cursors.values()) {
      if (cursor.val.match(ref)) {
        cursor.val.addDependency(ref)
      }
    }
  }

  // remove the node by id
  delete(id: string) {
    const m = this

    const node = m.#nodes.get(id)
    if (node == null) {
      return
    }

    node.delete()
    m.#nodes.delete(id)
  }

  // -- queries --
  // get all nodes
  get all(): Ref<PageNode>[] {
    return Array.from(this.#nodes.values())
  }

  // get a node by id
  get(id: string): Ref<PageNode> | null {
    return this.#nodes.get(id) || null
  }

  // get the node for a file
  getByFile(file: FileRef): Ref<PageNode> | null {
    return this.get(PageNode.id(file))
  }

  // get a cursor to the watched path
  query(path: string): Ref<PageCursor> {
    const m = this

    let cursor: Ref<PageCursor> | null = m.#cursors.get(path) || null
    if (cursor == null) {
      cursor = new Ref(m.#initCursor(path))
      m.#cursors.set(path, cursor)
    }

    return cursor
  }

  // -- TemplateQueryMatch --
  // finds all matching paths for a query
  match(query: string): string[] {
    const m = this

    // find the cursor
    const cursor = m.#cursors.get(query)?.val || null
    if (cursor == null) {
      throw new Error(`no cursor for ${query} to match against`)
    }

    // find all paths that match the cursor
    const matches = []
    for (const path of m.#nodes.keys()) {
      if (cursor.matchPath(path)) {
        matches.push(path)
      }
    }

    return matches
  }

  // -- factories --
  // create a new cursor matching any existing nodes
  #initCursor(path: string): PageCursor {
    const cursor = new PageCursor(path)

    // add any matching nodes
    for (const node of this.#nodes.values()) {
      if (cursor.match(node)) {
        cursor.addDependency(node)
      }
    }

    return cursor
  }
}
