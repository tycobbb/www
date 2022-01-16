import * as E from "https://deno.land/x/eta@v1.12.3/mod.ts"
import { AstObject } from "https://deno.land/x/eta@v1.12.3/parse.ts"
import { dirname, basename, extname, join } from "https://deno.land/std@0.105.0/path/mod.ts"

// -- constants --
// matches includes that may or may not have args
const kIncludePattern = /include\(([^,]*)(,\s*\{(.*)\})?\)/

// -- impls --
export class Templates {
  // -- module --
  static get = () => new Templates()

  // -- commands --
  init() {
    // only configure once
    const cfg = E.config
    if (cfg.ready) {
      return
    }

    // capture base include fn
    const incl = cfg.include

    // configure eta
    E.configure({
      // flag this as configured
      ready: true,
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
            if (typeof token === "string" || token.t == "e") {
              continue;
            }

            // if this is not an include, skip
            if (!token.val.startsWith("include")) {
              continue;
            }

            // match the token
            const match = token.val.match(kIncludePattern)
            if (match == null) {
              continue;
            }

            // update token with base path arg
            const path = match[1]
            const args = match[3]
            token.val = `include(${path}, { path: "${base}", ${args || ""} })`
          }

          return buffer
        },
      }]
    })
  }

  // -- commands --
  /// add a template from a raw string, keyed by its path
  add(filename: string, raw: string) {
    // slice off the extension
    const path = filename.slice(0, -7)

    // console.log("TEST RENDER", E.compile(raw)({ i: 69 }, E.config))

    // register the compiled path
    E.templates.define(path, E.compile(raw))
  }

  // -- queries --
  render(filename: string, raw: string, data: Record<string, unknown> = {}): string {
    // grab the directory
    const path = dirname(filename)

    // render the template w/ the path as context
    return E.render(raw, data, { path }) as string
  }
}
