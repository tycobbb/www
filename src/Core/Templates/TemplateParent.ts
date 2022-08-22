import { EtaConfig } from "https://deno.land/x/eta@v1.12.3/config.ts"
import { TemplateHelpers } from "./TemplateHelpers.ts"

// -- types --
type HelperMatch = {
  // the length of the match
  len: number,

  // the substitution string
  sub: string
}

// -- constants --
const k = {
  token: {
    // arg delimiter
    comma: ",",
    // string delimiter
    quote: "\"",
    // left paren
    lparen: "(",
    // right parent
    rparen: ")",
    // a pattern for helpers that require a parent
    helpers: (() => {
      const helpers = [
        ...TemplateHelpers.new,
        "include"
      ]

      return new RegExp(`^(${helpers.join("|")})\\s*\\(`)
    })()
  }
}

// -- impls --
// an eta plugin that passes parent paths down to helper functions
export class TemplateParent {
  // -- queries --
  // replace helper invocations in the str
  #process(str: string, base: string): string {
    const m = this

    // the result string
    let res = str

    // for every character in the string
    for (let i = 0; i < res.length; /* none */) {
      let ii = i + 1

      // if we find a helper here
      const match = m.#match(res.slice(i), base)
      if (match != null) {
        // replace the call
        res = res.slice(0, i) + match.sub + res.slice(i + match.len)

        // and move to the end of the new call
        ii = i + match.sub.length
      }

      // advance the index
      i = ii
    }

    return res
  }

  // find a helper match
  #match(str: string, base: string): HelperMatch | null {
    const m = this

    // if this isn't a helper, return a miss
    const start = str.match(k.token.helpers)
    if (start == null) {
      return null
    }

    // the result string
    let res = str

    // the length of the match in the original string
    let ml = start[0].length

    // the end indices of a match in the final string
    let m1 = -1

    // the start index of the non-path args
    let a0 = -1

    // the paren count
    let pc = 1

    // if we're in a string
    let st = false

    // for the rest of the helper
    for (let j = ml; j < res.length; /* none */) {
      // the next index
      let jj = j + 1
      let ll = ml + 1

      // if in helper, parse the next char
      const ch = res[j]

      // incr on non-string open paren
      if (!st && ch === k.token.lparen) {
        pc += 1
      }

      // decr on non-string close paren
      if (!st && ch === k.token.rparen) {
        pc -= 1
      }

      // if we're back to zero parens, we succeeded!
      if (pc === 0) {
        m1 = jj
        ml = ll
        break
      }

      // if we haven't found the second arg, look for that
      if (a0 === -1) {
        if (ch === k.token.comma) {
          a0 = j
        }
      }
      // otherwise, we're parsing args
      else {
        // if we find a nested helper
        const match = m.#match(res.slice(j), base)
        if (match != null) {
          // replace the call
          res = res.slice(0, j) + match.sub + res.slice(j + match.len)

          // incr match length by the length of the nested helper
          ll = ml + match.len

          // and move to the end of the new call
          jj = j + match.sub.length
        }
        // if we hit a quotation mark, flip string flag
        else if (ch === k.token.quote) {
          st = !st
        }
      }

      // update length
      ml = ll

      // update index
      j = jj
    }

    // if we didn't complete our match,
    if (m1 === -1) {
      throw new Error("failed to parse helper call")
    }

    // if we didn't find any args, they are before the closing paren
    if (a0 == -1) {
      a0 = m1 - 1
    }

    // otherwise, return the match
    const match = {
      len: ml,
      sub: `${res.slice(0, a0)},"${base}"${res.slice(a0, m1)}`
    }

    return match
  }

  // -- EtaPlugin --
  // shim parent path into calls
  processFnString(str: string, cfg: EtaConfig): string {
    // make sure we have a path to add
    const base = cfg.path
    if (base == null || typeof base != "string") {
      return str
    }

    // add parent to all helper calls
    const processed = this.#process(str, base)
    return processed
  }
}