import { globToRegExp } from "https://deno.land/std@0.184.0/path/glob.ts";
import { Ref } from "../../Core/mod.ts"
import { PageDependency, PageNode } from "./PageNode.ts";

// a live cursor of page nodes matching a query
export class PageCursor implements PageDependency {
  // -- props --
  // the cursor query
  #query: RegExp

  // the set of dependenices
  #dependencies: Set<Ref<PageDependency>> = new Set()

  // -- lifetime --
  constructor(query: string) {
    this.#query = globToRegExp(query)
  }

  // -- commands --
  // add a dependency to this node
  addDependency(dep: Ref<PageDependency>) {
    this.#dependencies.add(dep)
  }

  // -- queries --
  // if the node matches the cursor
  match(node: Ref<PageNode>) {
    return this.#query.test(node.val.path.rel)
  }

  // -- PageDependent --
  // if the cursor is dirty
  get isDirty(): boolean {
    const m = this

    // and flag any dependents
    for (const dep of m.#dependencies) {
      // if dep was deleted, remove it
      if (!dep.isPresent) {
        m.#dependencies.delete(dep)
        continue
      }

      if (dep.val.isDirty) {
        return true
      }
    }

    return false
  }
}