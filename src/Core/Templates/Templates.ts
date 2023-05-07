import * as E from "https://deno.land/x/eta@v1.12.3/mod.ts"
import { single } from "../Scope.ts"
import { EventStream, EventBus, EventListener } from "../Events.ts"
import { TemplateEvent } from "./TemplateEvent.ts"
import { TemplateFrag } from "./TemplateFrag.ts"
import { TemplateData, TemplateDataDb } from "./TemplateData.ts"
import { TemplateHelpers } from "./TemplateHelpers.ts"
import { TemplateParent } from "./TemplateParent.ts"
import { TemplateQuery } from "./TemplateQuery.ts"

// -- impls --
// eta templates that support relative pathing
export class Templates {
  // -- module --
  static readonly get = single(() => new Templates())

  // -- props --
  // a bus for include events
  #evts: EventStream<TemplateEvent>

  // a store for arbitrary template data
  #data: TemplateDataDb

  // -- lifetime --
  // create a new template repo
  constructor(
    evts: EventStream<TemplateEvent> = new EventBus()
  ) {
    // set props
    this.#evts = evts
    this.#data = {id: Math.random()}

    // configure eta
    this.#configure()
  }

  // -- commands --
  // add a template by path from a raw string
  add(path: string, raw: string) {
    // register the compiled path
    E.templates.define(path, E.compile(raw, { path }))
  }

  // add template data by path
  addData(path: string, data: unknown) {
    this.#data[path] = data
  }

  // delete a template by path
  delete(path: string) {
    E.templates.remove(path)
  }

  // -- c/debug
  // reset state (only use this in testing)
  reset() {
    E.templates.reset()

    // clear data (don't create a new obj; config captures it by reference)
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
    // look up the template
    const tmpl = E.templates.get(path)
    if (tmpl == null) {
      throw new Error(`template ${path} does not exist`)
    }

    // render the template w/ the path as context
    return await <Promise<string>>E.renderAsync(tmpl, data)
  }

  // -- setup --
  #configure() {
    // capture ref to outer this to call listeners
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
      query: TemplateQuery.helper(m.#data, m.#evts),

      // add plugins
      plugins: [
        // expose helpers as globals
        new TemplateHelpers(),

        // pass parent path to helpers,
        new TemplateParent(),

        // compile w:frag html elements
        new TemplateFrag.Plugin(),
      ]
    })
  }
}
