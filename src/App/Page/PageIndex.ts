import { Ref } from "../../Core/mod.ts";
import { PageCursor } from "./PageCursor.ts";
import { PageNode } from "./PageNode.ts";

// -- types --
type Table<T> = { [key: string]: T }

// -- impls --
export class PageIndex {
  // -- props --
  /// a map of nodes
  #nodes: Table<Ref<PageNode>> = {}

  /// a map of paths to active cursors
  #cursors: Table<PageCursor> = {}

  // -- commands --
  /// add a new node
  add(node: PageNode) {
    this.#nodes[node.id] = new Ref(node)
  }

  /// remove the node by id
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
  /// get all nodes
  get all(): Ref<PageNode>[] {
    return Object.values(this.#nodes)
  }

  /// get a node by id
  get(id: string): Ref<PageNode> {
    return this.#nodes[id]
  }

  /// get a cursor to the watched path
  query(path: string): PageCursor {
    const m = this

    let cursor: PageCursor | null = m.#cursors[path]
    if (cursor == null) {
      cursor = new PageCursor()
      m.#cursors[path] = cursor
    }

    return cursor
  }
}
