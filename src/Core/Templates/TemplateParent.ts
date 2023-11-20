import { EtaConfig } from "https://deno.land/x/eta@v1.12.3/config.ts"
import { TemplateHelpers } from "./TemplateHelpers.ts"
import { Parser } from "../Parser/mod.ts"
import {
  any,
  delimited,
  first,
  inner,
  lazy,
  left,
  literal,
  map,
  outer,
  pair,
  pattern,
  sequence,
  sparse,
  str,
  surround,
  unwrap,
  whitespace,
} from "../Parser/mod.ts"

// -- constants --
const k = {
  // fn patterns
  fn: {
    // the fn name; can be a compound identifier, e.g. `Object.assign`
    name: /^[a-zA-Z\$_][\w\$_\.]*/,
    // a fallback arg part, anything that's not a delimiter
    // TODO: this matches chunks of objects and can screw with a fn's args list,
    // e.g. `{k1:"v1"` from `{k1:"v1",k2:"v2"}`. but this may not matter for us
    // in practice.
    part: /^[^,\)]+/,
  },
  obj: {
    // an object (non-string) key
    key: /^[a-zA-Z\$_]+/,
  }
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
  = HelperArgPart[]

// a part of a helper arg
type HelperArgPart
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
  #compile(nodes: HelperNode[], parent: HelperArg): string {
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
  #compileFn(fn: Helper, parent: HelperArg): string {
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

  // compile a helper fn's args
  #compileFnArgs(args: HelperArg[], parent: HelperArg) {
    return args
      .map((arg) => (
        arg
          .map((p) => typeof p === "string" ? p : this.#compileFn(p, parent))
          .join("")
      ))
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
    const parent = [`"${path}"`]

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
    node(),
    any,
    HelperNode.text,
  )
}

// a parser for a single node
function node(): Parser<HelperNode> {
  return first(
    map(
      str.quoted(),
      HelperNode.text
    ),
    map(
      helper(),
      HelperNode.helper
    )
  )
}

// a parser for a helper
function helper(): Parser<Helper> {
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
      // then args
      left(
        surround(
          delimited(
            sequence(
              value(),
            ),
            surround(
              literal(","),
              whitespace(),
            )
          ),
          whitespace(),
        ),
        // closed by a paren
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

function value(): Parser<HelperArgPart> {
  return lazy(() => $value())
}

function $value(): Parser<HelperArgPart> {
  return first(
    str.quoted(),
    object(),
    helper(),
    pattern(k.fn.part)
  )
}

// an object-literal
function object(): Parser<string> {
  return map(
    inner(
      surround(
        literal("{"),
        whitespace(),
      ),
      delimited(
        objectEntry(),
        surround(
          literal(","),
          whitespace(),
        )
      ),
      surround(
        literal("}"),
        whitespace(),
      )
    ),
    (entries) => `{${entries.map(([key, val]) => `${key}:${val}`).join(",")}}`
  )
}

// an object-literal key-value pair
function objectEntry(): Parser<[string, HelperArgPart]> {
  return outer(
    objectKey(),
    surround(
      literal(":"),
      whitespace(),
    ),
    value()
  )
}

// an object-literal key
function objectKey(): Parser<string> {
  return first(
    str.quoted(),
    pattern(k.obj.key)
  )
}