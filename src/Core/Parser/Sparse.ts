import { Parser } from "./Parsers.ts"
import {
  first,
  map,
  mapInput,
  repeat,
} from "./Parsers.ts"

// -- types --
// the possible sparse node types
// deno-lint-ignore no-unused-vars
enum SparseNodeKind {
  inner,
  slice,
}

import NK = SparseNodeKind

// a sparse node
type SparseNode<A>
  = { kind: NK.inner, inner: A }
  | { kind: NK.slice, input: string, len: number }

const SparseNode = {
  // a node of the wrapped type
  inner<A>(inner: A): SparseNode<A> {
    return { kind: NK.inner, inner }
  },
  // a text slice
  slice<A>(input: string, len: number): SparseNode<A> {
    return { kind: NK.slice, input, len }
  },
}

// -- impls --
// a parser for a sparse sequence of nodes surrounded by undifferentiated text
export function sparse<A>(
  p1: Parser<A>,
  p2: Parser<string>,
  fromText: (str: string) => A,
): Parser<A[]> {
  return map(
    repeat(
      first(
        map(
          p1,
          (h) => SparseNode.inner(h)
        ),
        mapInput(
          p2,
          (_, input) => SparseNode.slice<A>(input, 1)
        ),
      ),
      // init list
      () => [],
      // build list, merging consecutive slices
      (nodes: SparseNode<A>[], n) => {
        const p = nodes[nodes.length - 1]

        // if the prev and next are slices, merge
        if (p != null && p.kind === NK.slice && n.kind === NK.slice) {
          p.len += n.len
        }
        // otherwise, append the new node
        else {
          nodes.push(n)
        }

        return nodes
      },
    ),
    // finalize slices convert as wrapped type
    (nodes) => {
      return nodes.map((n) => {
        switch (n.kind) {
        case NK.inner:
          return n.inner
        case NK.slice:
          return fromText(n.input.slice(0, n.len))
        }
      })
    },
  )
}
