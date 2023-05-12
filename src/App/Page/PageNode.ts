import { Node } from "https://deno.land/x/deno_dom@v0.1.21-alpha/deno-dom-wasm.ts"
import { Ref } from "../../Core/mod.ts"
import { FileRef, FilePath, FileKind } from "../File/mod.ts"

// -- types --
export interface PageDependent {
  // mark the dependent as dirty
  flag(): void
}

export interface PageDependency {
  // if the dependency is dirty
  get isDirty(): boolean
}

// -- impls --
// a node in the page tree
export class PageNode implements PageDependent, PageDependency {
  // -- props --
  // if this node is dirty
  #isDirty = false

  // the path to the corresponding file
  #file: FileRef

  // the set of dependents
  #dependents: Set<Ref<PageDependent>> = new Set()

  // the set of dependenices
  #dependencies: Set<Ref<PageDependency>> = new Set()

  // -- lifetime --
  // init a new node w/ the file
  constructor(file: FileRef) {
    this.#file = file
  }

  // -- commands --
  // add a dependent to this node
  addDependent(dep: Ref<PageDependent>) {
    this.#dependents.add(dep)
  }

  // add a dependency to this node
  addDependency(dep: Ref<PageDependency>) {
    this.#dependencies.add(dep)
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
    for (const dep of m.#dependents) {
      // if dep was deleted, remove it
      if (!dep.isPresent) {
        m.#dependents.delete(dep)
        continue
      }

      // otherwise, flag it
      dep.val.flag()
    }
  }

  // -- queries --
  // the node's id
  get id(): string {
    return PageNode.id(this.#file)
  }

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

  // if this node is ready to be compiled
  isReady(): boolean {
    const m = this

    // if any dependency is dirty, this is not ready
    for (const dep of m.#dependencies) {
      // if dep was deleted, remove it
      if (!dep.isPresent) {
        m.#dependencies.delete(dep)
        continue
      }

      if (dep.val.isDirty) {
        return false
      }
    }

    return true
  }

  // -- q/PageDependent
  // if the node is dirty
  get isDirty(): boolean {
    return this.#isDirty
  }

  // -- q/static
  // the node id for a file
  static id(file: FileRef) {
    return file.path.rel
  }
}