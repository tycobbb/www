import * as E from "https://deno.land/x/eta@v1.12.3/mod.ts"
import { TemplateFunction } from "https://deno.land/x/eta@v1.12.3/compile.ts"
import { Index } from "../Index.ts"

// a cache for compiled templates
export class TemplateCache {
  // -- props --
  // a path -> child key -> template function index
  #children: Index<Index<TemplateFunction>> = {}

  // -- commands --
  // register the compiled template
  add(path: string, raw: string) {
    E.templates.define(path, E.compile(raw, { path }))
  }

  // register the compiled child template
  addChild(path: string, key: string, raw: string) {
    const m = this

    // find children for this path
    let children = m.#children[path]
    if (children == null) {
      children = {}
      m.#children[path] = children
    }

    // and compile the child
    children[key] = E.compile(raw, { path })
  }

  // -- queries --
  // render the template for the path
  async render(path: string, data: Record<string, unknown> = {}) {
    // look up the template
    const template = E.templates.get(path)
    if (template == null) {
      throw new Error(`template ${path} does not exist`)
    }

    // render the template
    return await <Promise<string>>E.renderAsync(template, data)
  }

  // render the child template for the path & key
  renderChild(path: string, key: string, data: Record<string, unknown> = {}) {
    const m = this

    // look up the template
    const children = m.#children[path]
    if (children == null) {
      throw new Error(`template ${path} has no children`)
    }

    const template = children[key]
    if (children == null) {
      throw new Error(`template ${path} does not have a child ${key}`)
    }

    // render the template
    return E.render(template, data)
  }

  // delete the template and children of the path
  delete(path: string) {
    E.templates.remove(path)
    delete this.#children[path]
  }

  // reset the cache (only use in testing)
  reset() {
    E.templates.reset()
    this.#children = {}
  }
}