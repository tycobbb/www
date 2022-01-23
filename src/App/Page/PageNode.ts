import { Ref } from "../../Core/mod.ts"
import { FileRef, FilePath, FileKind } from "../File/mod.ts"

// -- types --
export interface PageDependent {
  // invalidate the dependent, marking it for update
  flag(): void
}

// a node in the page tree
export class PageNode implements PageDependent {
  // -- props --
  // if this node is dirty
  #isDirty = true

  // the path to the corresponding file
  #file: FileRef

  // the list of dependents
  #deps: Set<Ref<PageDependent>> = new Set()

  // -- lifetime --
  // init a new node w/ the file
  constructor(file: FileRef) {
    this.#file = file
  }

  // -- commands --
  // add a dependent to this node
  addDependent(dep: Ref<PageDependent>) {
    this.#deps.add(dep)
  }

  // mark this node as resolved
  clear() {
    this.#isDirty = false
  }

  // -- c/PageDependent
  // flag the node and its dependents as dirty
  flag() {
    const m = this

    // flag this node as dirty
    m.#isDirty = true

    // and flag any dependents
    for (const ref of m.#deps) {
      // if dep was deleted, remove it
      const dep = ref.deref()
      if (dep == null) {
        m.#deps.delete(ref)
        continue
      }

      // otherwise, flag it
      dep.flag()
    }
  }

  // -- queries --
  // the path to the corresponding file
  get path(): FilePath {
    return this.#file.path
  }

  // the kind of corresponding file
  get kind(): FileKind {
    return this.#file.kind
  }

  // read the corresponding file
  async read(): Promise<string> {
    return await this.#file.path.read()
  }

  // if the node is dirty
  get isDirty(): boolean {
    return this.#isDirty
  }
}