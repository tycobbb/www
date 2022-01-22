import { FileRef, FilePath, FileKind } from "../File/mod.ts"

// -- types --
interface PageDependent {
  // invalidate the dependent, marking it for update
  mark(): void
}

// a node in the page tree
export class PageNode implements PageDependent {
  // -- props --
  // if this node is dirty
  #isDirty = true

  // the path to the corresponding file
  #file: FileRef

  // the list of dependents
  #dependents: PageDependent[] = []

  // -- lifetime --
  // init a new node w/ the file
  constructor(file: FileRef) {
    this.#file = file
  }

  // -- commands --
  // add a dependent to this node
  addDependent(dep: PageDependent) {
    this.#dependents.push(dep)
  }

  // mark this node as resolved
  clear() {
    this.#isDirty = false
  }

  // -- c/PageDependent
  mark() {
    const m = this

    // mark this node as dirty
    m.#isDirty = true

    // and mark any dependents as dirty
    for (const dep of m.#dependents) {
      dep.mark()
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