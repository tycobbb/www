import { Index, Ref } from "../../Core/mod.ts";
import { FileRef } from "../File/mod.ts";
import { PageCursor } from "./PageCursor.ts";
import { PageNode } from "./PageNode.ts";

// -- impls --
export class PageIndex {
  // -- props --
  // a map of nodes
  #nodes: Index<Ref<PageNode>> = {}

  // a map of paths to active cursors
  #cursors: Index<Ref<PageCursor>> = {}

  // -- commands --
  // add a new node
  add(node: PageNode) {
    const m = this

    // add the node
    const ref = new Ref(node)
    m.#nodes[node.id] = new Ref(node)

    // add the node to any cursors
    for (const cursor of Object.values(m.#cursors)) {
      if (cursor.val.match(ref)) {
        cursor.val.addDependency(ref)
      }
    }
  }

  // remove the node by id
  delete(id: string) {
    const m = this

    const node = m.#nodes[id]
    if (node == null) {
      return
    }

    node.delete()
    delete m.#nodes[id]
  }

  // -- queries --
  // get all nodes
  get all(): Ref<PageNode>[] {
    return Object.values(this.#nodes)
  }

  // get a node by id
  get(id: string): Ref<PageNode> {
    return this.#nodes[id]
  }

  // get the node for a file
  getByFile(file: FileRef): Ref<PageNode> {
    return this.get(PageNode.id(file))
  }

  // get a cursor to the watched path
  query(path: string): Ref<PageCursor> {
    const m = this

    let cursor: Ref<PageCursor> | null = m.#cursors[path]
    if (cursor == null) {
      cursor = new Ref(m.#initCursor(path))
      m.#cursors[path] = cursor
    }

    return cursor
  }

  // -- TemplateQueryMatch --
  // finds all matching paths for a query
  match(query: string): string[] {
    const m = this

    // find the cursor
    const cursor = m.#cursors[query].val

    // find all paths that match the cursor
    const matches = []
    for (const path in m.#nodes) {
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
    for (const node of this.all) {
      if (cursor.match(node)) {
        cursor.addDependency(node)
      }
    }

    return cursor
  }
}
