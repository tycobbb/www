import * as E from "https://deno.land/x/eta@v1.12.3/mod.ts"
import { transient } from "../Scope.ts"
import { EventStream, EventBus, EventListener } from "../Events.ts"
import { TemplateEvent } from "./TemplateEvent.ts"
import { TemplateCache } from "./TemplateCache.ts"
import { TemplateHtml } from "./TemplateHtml.ts"
import { TemplateRoot } from "./TemplateRoot.ts"
import { TemplateFrag } from "./TemplateFrag.ts"
import { TemplateData } from "./TemplateData.ts"
import { TemplateDataIndex } from "./TemplateDataIndex.ts"
import { TemplateParent } from "./TemplateParent.ts"
import { TemplateQuery } from "./TemplateQuery.ts"
import { TemplateQueryMatch } from "./TemplateQueryMatch.ts"
import { TemplateHelpers } from "./TemplateHelpers.ts"

// eta templates that support relative pathing
export class Templates {
  // -- module --
  static readonly get = transient((match: TemplateQueryMatch) => new Templates(match))

  // -- deps --
  // finds all matching paths for a query
  #match: TemplateQueryMatch

  // -- props --
  // a bus for template events
  #evts: EventStream<TemplateEvent>

  // a store for arbitrary template data
  #data: TemplateDataIndex

  // a cache for storing and rendering stored templates
  #cache: TemplateCache

  // -- lifetime --
  // create a new template repo
  constructor(
    match: TemplateQueryMatch,
    evts: EventStream<TemplateEvent> = new EventBus()
  ) {
    const m = this

    // set deps
    this.#match = match

    // set props
    this.#evts = evts
    this.#data = { pages: {} }
    this.#cache = new TemplateCache()

    // configure eta
    m.#configure()
  }

  // -- commands --
  // add a template by path from a raw string
  add(path: string, raw: string) {
    this.#cache.add(path, raw)
  }

  // add template data by path
  addData(path: string, data: unknown) {
    this.#data[path] = data
  }

  // add template page data by path
  addPageData(path: string, data: Record<string, unknown>) {
    this.#data.pages[path] = data
  }

  // delete a template by path
  delete(path: string) {
    // remove the templates
    this.#cache.delete(path)

    // remove any page data
    delete this.#data.pages[path]
  }

  // -- c/debug
  // reset state (only use this in testing)
  reset() {
    // reset templates
    this.#cache.reset()

    // reset data (don't create a new obj; config captures it by reference)
    const m = this
    for (const key in m.#data) {
      delete m.#data[key]
    }
  }

  // -- events --
  // when include is called from a template
  on(listener: EventListener<TemplateEvent>) {
    this.#evts.on(listener)
  }

  // -- queries --
  // render the template; throws an error if it doesn't exist
  async render(path: string, data: Record<string, unknown> = {}): Promise<string> {
    return await this.#cache.render(path, data)
  }

  // -- setup --
  #configure() {
    const m = this

    // create a frag helper to use a few times
    const frag = TemplateFrag.helper(m.#evts)

    // configure eta
    // TODO: break this stuff up into multiple files...
    E.configure({
      // get rid of includeFile so layouts use include
      includeFile: undefined,

      // redefine include to use frag helper
      include: frag,

      // define frag helper
      frag,

      // define data helper
      data: TemplateData.helper(m.#data, m.#evts),

      // define query helper
      query: TemplateQuery.helper(m.#data, m.#match, m.#cache, m.#evts),

      // add plugins
      plugins: [
        // expose helpers as globals
        new TemplateHelpers(),

        // pass parent path to helpers,
        new TemplateParent(),

        // compile w:frag html elements
        new TemplateHtml([
          new TemplateRoot.Compiler(),
          new TemplateFrag.Compiler(),
          new TemplateQuery.Compiler()
        ]),
      ]
    })
  }
}
