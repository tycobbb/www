import * as E from "https://deno.land/x/eta@v1.12.3/mod.ts"
import { AstObject } from "https://deno.land/x/eta@v1.12.3/parse.ts"
import { dirname, join } from "https://deno.land/std@0.105.0/path/mod.ts"
import { lazy } from "../Lazy.ts"

// -- constants --
// matches includes & layouts that may or may not have args
const kIncludePattern = /(include|layout)\(([^,]*)(,\s*\{(.*)\})?\)/

// -- impls --
export class Templates {
  // -- module --
  static get = lazy(() => new Templates())

  // -- commands --
  constructor() {
    // capture ref to outer self for notifications
    const self = this

    // capture base include fn
    const incl = E.config.include

    // configure eta
    E.configure({
      // get rid of includeFile so layouts use include
      includeFile: undefined,

      // redefine include to resolve base path
      include: function myInclude(path: string, args: Record<string, unknown>) {
        // resolve path against base
        const { path: base, ...rest } = args
        if (base != null && typeof base == "string") {
          path = join(base, path)
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

  // -- commands --

  // add a template from a raw string
  add(path: string, raw: string) {
    // grab the directory
    const base = dirname(path)

    // register the compiled path
    E.templates.define(path, E.compile(raw, { path: base }))
  }

  // remove the template
  delete(path: string) {
    E.templates.remove(path)
  }

  // reset all templates
  reset() {
    E.templates.reset()
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
}
