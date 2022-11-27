import {
  AssertionError,
  assert,
  assertEquals,
  assertMatch,
  assertThrows,
  assertRejects,
} from "https://deno.land/std@0.122.0/testing/asserts.ts"

import {
  ParserResult,
  ParserStatus as PS
} from "../Core/Parser/mod.ts"

// -- asserts --
// asserts the value is null
export function assertLength<T>(actual: T[], expected: number) {
  assert(actual.length === expected, `${actual} did not have length of ${expected}`)
}

// asserts the actual string contains the substring
export function assertIncludes(actual: string, substring: string) {
  assert(actual.includes(substring), `${actual} did not include ${substring}`)
}

// asserts the actual string does not contain the substring
export function assertNotIncludes(actual: string, substring: string) {
  assert(!actual.includes(substring), `${actual} included ${substring}`)
}

// asserts the values are partially equal given a selector
export function assertPartial<T, U>(actual: T, expected: T, select: (val: T) => U) {
  try {
    // check partial equality
    assertEquals(select(actual), select(expected))
  } catch (err) {
    // if failed, throw full equality error for a nicer diff
    if (err instanceof AssertionError) {
      assertEquals(actual, expected)
    }
    // if not test failure, just rethrow
    else {
      throw err
    }
  }
}

// assert the match of two results, ignoring error string
export function assertParser<V>(
  a: ParserResult<V>,
  e: ParserResult<V>,
) {
  assertPartial(a, e, (res) => {
    if (res.stat === PS.success) {
      return res
    }

    const { error: _, ...rest } = res
    return rest
  })
}

// -- reexports --
export {
  assert,
  assertEquals,
  assertMatch,
  assertThrows,
  assertRejects,
}
