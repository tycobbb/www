import * as E from "https://deno.land/x/eta@v1.12.3/mod.ts"
import { AstObject } from "https://deno.land/x/eta@v1.12.3/parse.ts"
import { dirname, join } from "https://deno.land/std@0.122.0/path/mod.ts"
import { single } from "../Scope.ts"
import { EventStream, EventBus, EventListener } from "../Events.ts"
import { TemplateEvent } from "./TemplateEvent.ts"
import { TemplateData } from "./TemplateData.ts"
import { EtaConfig } from "https://deno.land/x/eta@v1.12.3/config.ts"

// -- constants --
// matches includes & layouts that may or may not have args
const kHelperPattern = /(layout|include|data)\(([^,]*)(,\s*\{(.*)\})?\)(.*)/s

// -- impls --
// eta templates that support relative pathing
export class Templates {
  // -- module --
  static readonly get = single(() => new Templates())

  // -- props --
  // a bus for include events
  #evts: EventStream<TemplateEvent>

  // a store for arbitrary template data
  #data: TemplateData

  // -- lifetime --
  // create a new template repo
  constructor(
    evts: EventStream<TemplateEvent> = new EventBus()
  ) {
    // set props
    this.#evts = evts
    this.#data = {}

    // configure eta
    this.#configure()
  }

  // -- commands --
  // add a template from a raw string
  add(path: string, raw: string) {
    // register the compiled path
    E.templates.define(path, E.compile(raw, { path }))
  }

  // bind data to the given path
  bind(path: string, data: unknown) {
    this.#data[path] = data
  }

  // remove the template
  delete(path: string) {
    E.templates.remove(path)
  }

  // -- c/debug
  // reset state (only use this in debugging)
  reset() {
    this.#data = {}
    E.templates.reset()
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

    // capture base include fn
    const incl = E.config.include

    function resolvePath(path: string, parent: string) {
        // if this is a relative path, resolve against parent dir
        if (path.startsWith(".")) {
          return join(dirname(parent), path)
        }
        // else, this is absolute
        else {
          return path
        }
    }

    // configure eta
    // TODO: break this stuff up into multiple files...
    E.configure({
      ready: true,

      // get rid of includeFile so layouts use include
      includeFile: undefined,

      // redefine include to resolve base path
      include: function include(path: string, args: { parent: string, [key: string]: unknown }) {
        // extract parent from args
        const { parent, ...rest } = args

        // resolve path against parent
        const child = resolvePath(path, parent)

        // send include event
        m.#evts.send(TemplateEvent.include(child, parent))

        // run original include w/ resolved path
        return incl!.call(this, child, rest)
      },

      // fetch a path from the data store
      data(path: string, args: { parent: string }): unknown {
        // get parent
        const parent = args.parent

        // resolve path against parent
        const child = resolvePath(path, parent)

        // get data
        const val = m.#data[child]
        if (val == null) {
          throw new Error(`templates missing data for "${child}"`)
        }

        // send include event
        m.#evts.send(TemplateEvent.include(child, parent))

        return val
      },

      // add plugin to add parent path to helper calls
      plugins: [{
        // add globals
        processFnString(fnStr: string, _: EtaConfig) {
          return "var data=E.data.bind(E);" + fnStr
        },
        // shim parent path into calls
        processAST(buffer: AstObject[], env: EtaConfig): AstObject[] {
          // make sure we have a path to add
          const base = env.path
          if (base == null || typeof base != "string") {
            return buffer
          }

          // add the parent path to each call
          for (const token of buffer) {
            // if this is not interpolated, skip
            if (typeof token === "string") {
              continue;
            }

            // match the token
            const match = token.val.match(kHelperPattern)
            if (match == null) {
              continue;
            }

            // update token with parent path arg
            const name = match[1]
            const path = match[2]
            const args = match[4]
            const rest = match[5]
            token.val = `${name}(${path}, { parent: "${base}", ${args || ""} })${rest}`
          }

          return buffer
        },
      }]
    })
  }
}
