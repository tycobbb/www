import { Ref } from "../../Core/mod.ts"
import { PageDependency } from "./PageNode.ts";

// a live cursor of page nodes matching a query
export class PageCursor implements PageDependency {
  // -- props --
  // the set of dependenices
  #dependencies: Set<Ref<PageDependency>> = new Set()

  // -- commands --
  // add a dependency to this node
  addDependency(dep: Ref<PageDependency>) {
    this.#dependencies.add(dep)
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