import { AstObject } from "https://deno.land/x/eta@v1.12.3/parse.ts"
import { EtaConfig } from "https://deno.land/x/eta@v1.12.3/config.ts"
import { TemplateHelpers } from "./TemplateHelpers.ts"

// -- constants --
// matches helpers that may or may not have args
const kHelperPattern = /(layout|include|data|frag)\(([^,]*)(,\s*\{(.*)\})?\)(.*)/s
// const kHelperPattern
//   = new RegExp(`(${TemplateHelpers.all.join("|")})\(([^,]*)(,\s*\{(.*)\})?\)(.*)`, "s")

// -- impls --
// an eta plugin that passes parent paths down to helper functions
export class TemplateParent {
  // -- EtaPlugin --
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
  }
}