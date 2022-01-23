import * as E from "https://deno.land/x/eta@v1.12.3/mod.ts"
import { AstObject } from "https://deno.land/x/eta@v1.12.3/parse.ts"
import { dirname, join } from "https://deno.land/std@0.105.0/path/mod.ts"
import { single } from "./Scope.ts"
import { EventStream, EventBus, EventListener } from "./Events.ts"

// -- constants --
// matches includes & layouts that may or may not have args
const kIncludePattern = /(include|layout)\(([^,]*)(,\s*\{(.*)\})?\)/

// -- types --
// an event when a template is included
export type IncludeEvent =
  { child: string, parent: string }

// -- impls --
// eta templates that support relative pathing
export class Templates {
  // -- module --
  static readonly get = single(() => new Templates())

  // -- props --
  // a bus for include events
  #evts: EventStream<IncludeEvent>

  // -- lifetime --
  constructor(
    evts: EventStream<IncludeEvent> = new EventBus()
  ) {
    this.#evts = evts
    this.#configure()
  }

  // -- commands --
  // add a template from a raw string
  add(path: string, raw: string) {
    // register the compiled path
    E.templates.define(path, E.compile(raw, { path }))
  }

  // remove the template
  delete(path: string) {
    E.templates.remove(path)
  }

  // reset all templates
  reset() {
    E.templates.reset()
  }

  // -- events --
  // when include is called from a template
  on(listener: EventListener<IncludeEvent>) {
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

    // check if already configured
    const cfg = E.config
    if (cfg.ready) {
      return
    }

    // capture base include fn
    const incl = cfg.include

    // configure eta
    E.configure({
      ready: true,

      // get rid of includeFile so layouts use include
      includeFile: undefined,

      // redefine include to resolve base path
      include: function include(path: string, args: Record<string, unknown>) {
        // resolve path against parent
        const { path: parent, ...rest } = args
        if (parent != null && typeof parent == "string") {
          path = join(dirname(parent), path)

          // send include event to listeners
          m.#evts.send({ child: path, parent })
        }

        // call base impl
        return incl!.call(this, path, rest)
      },

      // add plugin to pass base path from env to include calls
      plugins: [{
        processAST(buffer: AstObject[], env: Record<string, unknown>): AstObject[] {
          // make sure we have a path to add
          const base = env.path
          if (base == null || typeof base != "string") {
            return buffer
          }

          // add the base path to each include
          for (const token of buffer) {
            // if this is not interpolated, skip
            if (typeof token === "string") {
              continue;
            }

            // match the token
            const match = token.val.match(kIncludePattern)
            if (match == null) {
              continue;
            }

            // update token with base path arg
            const name = match[1]
            const path = match[2]
            const args = match[4]
            token.val = `${name}(${path}, { path: "${base}", ${args || ""} })`
          }

          return buffer
        },
      }]
    })
  }
}
