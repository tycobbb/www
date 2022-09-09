import { EtaConfig } from "https://deno.land/x/eta@v1.12.3/config.ts"
import { TemplateHelpers } from "./TemplateHelpers.ts"

import { Parser } from "../Parser/mod.ts"
import {
  any,
  debug,
  delimited,
  mapInput,
  inner,
  lazy,
  left,
  literal,
  map,
  pattern,
  pred,
  first,
  string,
  sparse,
  pair,
  surround,
  trio,
  unwrap,
  whitespace,
} from "../Parser/mod.ts"

// -- constants --
const k = {
  // identifier patterns
  fn: {
    name: /^[a-zA-Z\$_][\w\$_\.]*/,
  },
  // arg patterns
  arg: {
    path: /^[^,]+/,
  },
}

// -- types --
// a parsing configuration
type HelperConfig = Readonly<{
  fns: ReadonlySet<string>
}>

// the possible parsed node types
// deno-lint-ignore no-unused-vars
enum HelperNodeKind {
  helper,
  text,
}

import NK = HelperNodeKind

// a parsed node
type HelperNode
  = { kind: NK.helper, helper: Helper }
  | { kind: NK.text, text: string }

const HelperNode = {
  // create a text node
  text(text: string): HelperNode {
    return { kind: NK.text, text }
  },
  // create an element node
  helper(helper: Helper): HelperNode {
    return { kind: NK.helper, helper }
  }
}

// a helper call
type Helper = {
  name: string,
  args: HelperArg[] | null
}

// a helper arg
type HelperArg
  = Helper
  | string

// -- impls --
// an eta plugin that passes parent paths down to helper functions
export class TemplateParent {
  // -- props --
  // the helper config
  #cfg: HelperConfig = Object.freeze({
    fns: Object.freeze(new Set(TemplateHelpers.all))
  })

  // the helper parser
  #decode = decode()

  // -- queries --
  // compile a list of nodes
  #compile(nodes: HelperNode[], parent: string): string {
    const m = this

    const compiled = nodes.reduce((res, node) => {
      switch (node.kind) {
      case NK.text:
        return res + node.text
      case NK.helper:
        return res + m.#compileFn(node.helper, parent)
      }
    }, "")

    return compiled
  }

  // compile a helper fn
  #compileFn(fn: Helper, parent: string): string {
    const m = this

    // insert parent as second arg in helper call
    const args = fn.args || []
    if (m.#cfg.fns.has(fn.name)) {
      // helpers must have a path arg
      if (args == null || args.length === 0) {
        throw new Error(`template helper ${fn.name} must have at least one arg`)
      }

      args.splice(1, 0, parent)
    }

    // compile helper call
    const compiled = `${fn.name}(${m.#compileFnArgs(args, parent)})`

    return compiled
  }

  // compile a helper fn's
  #compileFnArgs(args: HelperArg[], parent: string) {
    return args
      .map((a) => {
        if (typeof a === "string") {
          return a
        }

        return this.#compileFn(a, parent)
      })
      .join(",")
  }

  // -- EtaPlugin --
  // shim parent path into calls
  processFnString(str: string, cfg: EtaConfig): string {
    const m = this

    // make sure we have a path to add
    const path = cfg.path
    if (path == null || typeof path != "string") {
      return str
    }

    // the parent is the quoted path
    const parent = `"${path}"`

    // decode nodes
    const nodes = m.#decode(str)
    if (nodes == null) {
      return str
    }

    // add parent to all helper calls
    const compiled = m.#compile(nodes, parent)

    return compiled
  }
}

// -- impls --
// create a fn that parses a sequence of nodes
function decode() {
  return unwrap(nodes())
}

// a parser for a sequence of nodes
function nodes(): Parser<HelperNode[]> {
  return sparse(
    map(
      helper(),
      HelperNode.helper
    ),
    any,
    HelperNode.text,
  )
}

// a parser for a helper
function helper(): Parser<Helper> {
  return lazy(() => $helper())
}

function $helper(): Parser<Helper> {
  return map(
    pair(
      // open fn
      left(
        pattern(k.fn.name),
        pair(
          whitespace(),
          literal("("),
        ),
      ),
      // or args
      left(
        surround(
          delimited(
            first(
              string(),
              helper(),
              pattern(/^[^,\)]*/),
            ),
            surround(
              literal(","),
              whitespace(),
            )
          ),
          whitespace(),
        ),
        literal(")"),
      ),
    ),
    // convert into element
    ([name, args]) => ({
      name,
      args,
    }),
  )
}